#include <algorithm>
#include <cassert>
#include <fstream>
#include <iostream>
#include <limits>
#include <numeric>
#include <stdexcept>
#include <string>
#include <vector>

template<class T> constexpr T twice(T value) { return value + value; }
int main() {
    static_assert(sizeof(void*) == EXPECTED_POINTER_BYTES, "wrong CPU target");
    static_assert(twice(0) == 0, "template check");
    std::vector<long long> data(100000);
    std::iota(data.begin(), data.end(), 0LL);
    std::reverse(data.begin(), data.end());
    std::sort(data.begin(), data.end());
    assert(std::accumulate(data.begin(), data.end(), 0LL) == 4999950000LL);
    assert(twice(2147483647LL) == 4294967294LL);
    try { data.at(data.size()); assert(false); }
    catch (const std::out_of_range&) {}
    std::string payload("A\0B\r\n", 5);
    { std::ofstream file("cpp's & file.bin", std::ios::binary); file.write(payload.data(), payload.size()); }
    std::ifstream file("cpp's & file.bin", std::ios::binary);
    std::string back((std::istreambuf_iterator<char>(file)), {});
    assert(back == payload);
    std::string line; std::getline(std::cin, line);
    assert(line == "spaces and symbols & 42");
    std::cout << "C++ edges OK";
}
