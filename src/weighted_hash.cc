#include "weighted_hash.h"
#include <algorithm>
#include <numeric>
#include <iostream>

void WeightedHash::setWeights(const std::unordered_map<std::string, double> &weights) noexcept
{
  nodes.clear();
  nodes.reserve(weights.size());

  // Calculate total weight and create nodes
  double totalWeight = 0.0;
  for (const auto &[name, weight] : weights)
  {
    if (name.empty())
      continue; // Skip empty node names
    totalWeight += weight;
    nodes.push_back({name, weight, 0.0});
  }

  // If no valid nodes or total weight is 0, return early
  if (nodes.empty() || totalWeight <= 0.0)
  {
    return;
  }

  // Normalize weights and calculate accumulated weights
  double accum = 0.0;
  for (auto &node : nodes)
  {
    node.weight /= totalWeight;
    accum += node.weight;
    node.accumulatedWeight = accum;
  }

  // Initialize DoubleJump with virtual nodes
  dj = std::make_unique<DoubleJump>();
  for (size_t i = 0; i < VIRTUAL_NODES; ++i)
  {
    double target = static_cast<double>(i) / VIRTUAL_NODES;
    auto it = std::lower_bound(nodes.begin(), nodes.end(), target,
                               [](const WeightedNode &node, double val)
                               {
                                 return node.accumulatedWeight < val;
                               });

    // Ensure we have a valid node to add
    if (it != nodes.end() && !it->name.empty())
    {
      // Add the physical node name with a virtual node suffix
      std::string virtualNodeName = it->name + "_" + std::to_string(i);
      dj->add(virtualNodeName);
    }
  }
}

[[nodiscard]] std::string WeightedHash::get(std::string_view key) const noexcept
{
  if (!dj || nodes.empty())
  {
    return {};
  }
  std::string result = dj->get(std::string(key));
  // Extract the physical node name (everything before the underscore)
  size_t underscorePos = result.find('_');
  if (underscorePos != std::string::npos)
  {
    return result.substr(0, underscorePos);
  }
  return result;
}

// Node.js wrapper implementation
Napi::FunctionReference WeightedHashWrapper::constructor;

Napi::Object WeightedHashWrapper::Init(Napi::Env env, Napi::Object exports)
{
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "WeightedHash", {
                                                             InstanceMethod("get", &WeightedHashWrapper::Get),
                                                             InstanceMethod("size", &WeightedHashWrapper::Size),
                                                             InstanceMethod("all", &WeightedHashWrapper::All),
                                                         });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("WeightedHash", func);
  return exports;
}

WeightedHashWrapper::WeightedHashWrapper(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<WeightedHashWrapper>(info)
{
  Napi::Env env = info.Env();
  weightedHash = std::make_unique<WeightedHash>();

  if (info.Length() < 1 || !info[0].IsObject())
  {
    Napi::TypeError::New(env, "Expected weights object as argument").ThrowAsJavaScriptException();
    return;
  }

  Napi::Object weights = info[0].As<Napi::Object>();
  std::unordered_map<std::string, double> weightMap;

  auto properties = weights.GetPropertyNames();
  bool hasValidWeights = false;
  for (uint32_t i = 0; i < properties.Length(); ++i)
  {
    auto key = properties.Get(i).As<Napi::String>().Utf8Value();
    if (key.empty())
      continue;

    auto value = weights.Get(key).As<Napi::Number>().DoubleValue();
    if (value > 0)
      hasValidWeights = true;
    weightMap[key] = value;
  }

  if (!hasValidWeights)
  {
    Napi::TypeError::New(env, "At least one node must have a positive weight").ThrowAsJavaScriptException();
    return;
  }

  weightedHash->setWeights(weightMap);
}

Napi::Value WeightedHashWrapper::Get(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString())
  {
    Napi::TypeError::New(env, "Expected string key as argument").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string key = info[0].As<Napi::String>().Utf8Value();
  std::string result = weightedHash->get(key);
  return Napi::String::New(env, result);
}

Napi::Value WeightedHashWrapper::Size(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  return Napi::Number::New(env, weightedHash->size());
}

Napi::Value WeightedHashWrapper::All(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  std::vector<std::string> all = weightedHash->all();

  Napi::Array result = Napi::Array::New(env);
  for (size_t i = 0; i < all.size(); ++i)
  {
    result[i] = Napi::String::New(env, all[i]);
  }
  return result;
}