#include "doublejump.h"
#include "metrohash64.h"
#include <random>

// Jump hash implementation
static int32_t jump_hash(uint64_t key, int32_t num_buckets) noexcept
{
  int64_t b = -1;
  int64_t j = 0;
  while (j < num_buckets)
  {
    b = j;
    key = key * 2862933555777941757ULL + 1;
    j = (b + 1) * (double(1LL << 31) / double((key >> 33) + 1));
  }
  return b;
}

void LooseHolder::add(const std::string &obj) noexcept
{
  if (m.find(obj) != m.end())
  {
    return;
  }

  if (f.empty())
  {
    a.push_back(obj);
    m[obj] = a.size() - 1;
  }
  else
  {
    size_t idx = f.back();
    f.pop_back();
    a[idx] = obj;
    m[obj] = idx;
  }
}

void LooseHolder::remove(const std::string &obj) noexcept
{
  auto it = m.find(obj);
  if (it != m.end())
  {
    f.push_back(it->second);
    a[it->second] = "";
    m.erase(it);
  }
}

[[nodiscard]] std::string LooseHolder::get(uint64_t key) const noexcept
{
  if (a.empty())
  {
    return "";
  }
  size_t h = jump_hash(key, a.size());
  return a[h];
}

void LooseHolder::shrink() noexcept
{
  if (f.empty())
  {
    return;
  }

  std::vector<std::string> newA;
  newA.reserve(a.size() - f.size());
  for (const auto &obj : a)
  {
    if (!obj.empty())
    {
      newA.push_back(obj);
      m[obj] = newA.size() - 1;
    }
  }
  a = std::move(newA);
  f.clear();
}

void CompactHolder::add(const std::string &obj) noexcept
{
  if (m.find(obj) != m.end())
  {
    return;
  }
  a.push_back(obj);
  m[obj] = a.size() - 1;
}

void CompactHolder::remove(const std::string &obj) noexcept
{
  auto it = m.find(obj);
  if (it != m.end())
  {
    size_t idx = it->second;
    size_t n = a.size();
    a[idx] = a[n - 1];
    m[a[idx]] = idx;
    a.pop_back();
    m.erase(it);
  }
}

[[nodiscard]] std::string CompactHolder::get(uint64_t key) const noexcept
{
  if (a.empty())
  {
    return "";
  }
  size_t h = jump_hash(key * 0xc6a4a7935bd1e995ULL, a.size());
  return a[h];
}

void CompactHolder::shrink(const std::vector<std::string> &newA) noexcept
{
  m.clear();
  for (size_t i = 0; i < newA.size(); ++i)
  {
    m.emplace(newA[i], i);
  }
  a = newA;
}

// Initialize static members
std::mt19937 DoubleJump::gen(DoubleJump::rd());
std::random_device DoubleJump::rd;

void DoubleJump::add(const std::string &obj) noexcept
{
  if (obj.empty())
  {
    return;
  }
  loose.add(obj);
  compact.add(obj);
}

void DoubleJump::remove(const std::string &obj) noexcept
{
  if (obj.empty())
  {
    return;
  }
  loose.remove(obj);
  compact.remove(obj);
}

[[nodiscard]] std::string DoubleJump::get(const std::string &key) const noexcept
{
  uint64_t hash = hashString(key);
  std::string obj = loose.get(hash);
  if (obj.empty())
  {
    return compact.get(hash);
  }
  return obj;
}

void DoubleJump::shrink() noexcept
{
  loose.shrink();
  compact.shrink(loose.getArray());
}

[[nodiscard]] size_t DoubleJump::len() const noexcept
{
  return compact.size();
}

[[nodiscard]] size_t DoubleJump::looseLen() const noexcept
{
  return loose.size();
}

[[nodiscard]] std::vector<std::string> DoubleJump::all() const noexcept
{
  return compact.getArray();
}

[[nodiscard]] std::string DoubleJump::random() const noexcept
{
  if (compact.empty())
  {
    return "";
  }
  std::uniform_int_distribution<size_t> dis(0, compact.size() - 1);
  return compact.getArray()[dis(gen)];
}

[[nodiscard]] uint64_t DoubleJump::hashString(const std::string &str) const noexcept
{
  uint8_t hash[8];
  MetroHash64::Hash(reinterpret_cast<const uint8_t *>(str.c_str()), str.length(), hash, 0);
  return *reinterpret_cast<uint64_t *>(hash);
}

// Node.js wrapper implementation
Napi::FunctionReference DoubleJumpWrapper::constructor;

Napi::Object DoubleJumpWrapper::Init(Napi::Env env, Napi::Object exports)
{
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "DoubleJump", {
                                                           InstanceMethod("add", &DoubleJumpWrapper::Add),
                                                           InstanceMethod("remove", &DoubleJumpWrapper::Remove),
                                                           InstanceMethod("get", &DoubleJumpWrapper::Get),
                                                           InstanceMethod("shrink", &DoubleJumpWrapper::Shrink),
                                                           InstanceMethod("len", &DoubleJumpWrapper::Len),
                                                           InstanceMethod("looseLen", &DoubleJumpWrapper::LooseLen),
                                                           InstanceMethod("all", &DoubleJumpWrapper::All),
                                                           InstanceMethod("random", &DoubleJumpWrapper::Random),
                                                       });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("DoubleJump", func);
  return exports;
}

DoubleJumpWrapper::DoubleJumpWrapper(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<DoubleJumpWrapper>(info)
{
  dj = std::make_unique<DoubleJump>();
}

Napi::Value DoubleJumpWrapper::Add(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  if (info.Length() < 1)
  {
    Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsString())
  {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string obj = info[0].As<Napi::String>().Utf8Value();
  dj->add(obj);
  return env.Undefined();
}

Napi::Value DoubleJumpWrapper::Remove(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  if (info.Length() < 1)
  {
    Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsString())
  {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string obj = info[0].As<Napi::String>().Utf8Value();
  dj->remove(obj);
  return env.Undefined();
}

Napi::Value DoubleJumpWrapper::Get(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  if (info.Length() < 1)
  {
    Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsString())
  {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string key = info[0].As<Napi::String>().Utf8Value();
  std::string result = dj->get(key);
  return Napi::String::New(env, result);
}

Napi::Value DoubleJumpWrapper::Shrink(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  dj->shrink();
  return env.Undefined();
}

Napi::Value DoubleJumpWrapper::Len(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  return Napi::Number::New(env, dj->len());
}

Napi::Value DoubleJumpWrapper::LooseLen(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  return Napi::Number::New(env, dj->looseLen());
}

Napi::Value DoubleJumpWrapper::All(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  std::vector<std::string> all = dj->all();

  Napi::Array result = Napi::Array::New(env);
  for (size_t i = 0; i < all.size(); ++i)
  {
    result[i] = Napi::String::New(env, all[i]);
  }
  return result;
}

Napi::Value DoubleJumpWrapper::Random(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  std::string result = dj->random();
  return Napi::String::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  return DoubleJumpWrapper::Init(env, exports);
}

NODE_API_MODULE(doublejump, Init)