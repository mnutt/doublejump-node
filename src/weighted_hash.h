#pragma once

#include <string>
#include <string_view>
#include <vector>
#include <unordered_map>
#include <napi.h>
#include "doublejump.h"

class WeightedHash
{
public:
  WeightedHash() = default;
  void setWeights(const std::unordered_map<std::string, double> &weights) noexcept;
  [[nodiscard]] std::string get(std::string_view key) const noexcept;
  [[nodiscard]] size_t size() const noexcept { return nodes.size(); }
  [[nodiscard]] std::vector<std::string> all() const noexcept { return dj ? dj->all() : std::vector<std::string>(); }

private:
  struct WeightedNode
  {
    std::string name;
    double weight;
    double accumulatedWeight; // Cumulative weight for binary search
  };

  std::vector<WeightedNode> nodes;
  std::unique_ptr<DoubleJump> dj;
  static constexpr size_t VIRTUAL_NODES = 1000; // Number of virtual nodes for distribution
};

// Node.js wrapper
class WeightedHashWrapper : public Napi::ObjectWrap<WeightedHashWrapper>
{
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  WeightedHashWrapper(const Napi::CallbackInfo &info);

private:
  static Napi::FunctionReference constructor;
  Napi::Value Get(const Napi::CallbackInfo &info);
  Napi::Value Size(const Napi::CallbackInfo &info);
  Napi::Value All(const Napi::CallbackInfo &info);
  std::unique_ptr<WeightedHash> weightedHash;
};