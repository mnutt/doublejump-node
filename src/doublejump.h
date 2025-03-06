#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <memory>
#include <random>
#include <napi.h>

class LooseHolder
{
public:
  void add(const std::string &obj) noexcept;
  void remove(const std::string &obj) noexcept;
  [[nodiscard]] std::string get(uint64_t key) const noexcept;
  void shrink() noexcept;
  [[nodiscard]] size_t size() const noexcept { return a.size(); }
  [[nodiscard]] const std::vector<std::string> &getArray() const noexcept { return a; }

private:
  std::vector<std::string> a;
  std::unordered_map<std::string, size_t> m;
  std::vector<size_t> f;
};

class CompactHolder
{
public:
  void add(const std::string &obj) noexcept;
  void remove(const std::string &obj) noexcept;
  [[nodiscard]] std::string get(uint64_t key) const noexcept;
  void shrink(const std::vector<std::string> &newA) noexcept;
  [[nodiscard]] size_t size() const noexcept { return a.size(); }
  [[nodiscard]] const std::vector<std::string> &getArray() const noexcept { return a; }
  [[nodiscard]] bool empty() const noexcept { return a.empty(); }

private:
  std::vector<std::string> a;
  std::unordered_map<std::string, size_t> m;
};

class DoubleJump
{
public:
  DoubleJump() = default;

  void add(const std::string &obj) noexcept;
  void remove(const std::string &obj) noexcept;
  [[nodiscard]] std::string get(const std::string &key) const noexcept;
  void shrink() noexcept;
  [[nodiscard]] size_t len() const noexcept;
  [[nodiscard]] size_t looseLen() const noexcept;
  [[nodiscard]] std::vector<std::string> all() const noexcept;
  [[nodiscard]] std::string random() const noexcept;

private:
  LooseHolder loose;
  CompactHolder compact;
  [[nodiscard]] uint64_t hashString(const std::string &str) const noexcept;
  static std::mt19937 gen;
  static std::random_device rd;
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