#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <memory>
#include <napi.h>

class LooseHolder
{
public:
  void add(const std::string &obj);
  void remove(const std::string &obj);
  std::string get(uint64_t key) const;
  void shrink();
  size_t size() const { return a.size(); }
  const std::vector<std::string> &getArray() const { return a; }

private:
  std::vector<std::string> a;
  std::unordered_map<std::string, size_t> m;
  std::vector<size_t> f;
};

class CompactHolder
{
public:
  void add(const std::string &obj);
  void remove(const std::string &obj);
  std::string get(uint64_t key) const;
  void shrink(const std::vector<std::string> &newA);
  size_t size() const { return a.size(); }
  const std::vector<std::string> &getArray() const { return a; }
  bool empty() const { return a.empty(); }

private:
  std::vector<std::string> a;
  std::unordered_map<std::string, size_t> m;
};

class DoubleJump
{
public:
  DoubleJump() = default;

  void add(const std::string &obj);
  void remove(const std::string &obj);
  std::string get(const std::string &key) const;
  void shrink();
  size_t len() const;
  size_t looseLen() const;
  std::vector<std::string> all() const;
  std::string random() const;

private:
  LooseHolder loose;
  CompactHolder compact;
  uint64_t hashString(const std::string &str) const;
};

// Node.js wrapper class
class DoubleJumpWrapper : public Napi::ObjectWrap<DoubleJumpWrapper>
{
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  DoubleJumpWrapper(const Napi::CallbackInfo &info);
  ~DoubleJumpWrapper() = default;

private:
  static Napi::FunctionReference constructor;
  Napi::Value Add(const Napi::CallbackInfo &info);
  Napi::Value Remove(const Napi::CallbackInfo &info);
  Napi::Value Get(const Napi::CallbackInfo &info);
  Napi::Value Shrink(const Napi::CallbackInfo &info);
  Napi::Value Len(const Napi::CallbackInfo &info);
  Napi::Value LooseLen(const Napi::CallbackInfo &info);
  Napi::Value All(const Napi::CallbackInfo &info);
  Napi::Value Random(const Napi::CallbackInfo &info);
  std::unique_ptr<DoubleJump> dj;
};