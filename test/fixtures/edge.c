#include <assert.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int compare(const void *a, const void *b) {
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);
}
int main(void) {
    unsigned int maximum = UINT_MAX;
    assert(maximum + 1u == 0u); /* Defined unsigned wrap; no signed-overflow UB. */
    assert(sizeof(void *) == EXPECTED_POINTER_BYTES);
    int64_t n = INT64_C(9223372036854775807);
    assert(n - 1 == INT64_C(9223372036854775806));
    int data[] = { INT_MAX, 0, INT_MIN, -1, INT_MAX };
    qsort(data, 5, sizeof(int), compare);
    assert(data[0] == INT_MIN && data[4] == INT_MAX);
    char *memory = calloc(100001, 1);
    assert(memory != NULL);
    memset(memory, 'x', 100000);
    assert(strlen(memory) == 100000);
    free(memory);
    FILE *file = fopen("binary & data.bin", "wb");
    const unsigned char bytes[] = {0, 10, 13, 127, 128, 255};
    assert(file && fwrite(bytes, 1, sizeof(bytes), file) == sizeof(bytes));
    fclose(file);
    file = fopen("binary & data.bin", "rb");
    unsigned char readback[6];
    assert(file && fread(readback, 1, 6, file) == 6 && fgetc(file) == EOF);
    fclose(file);
    assert(memcmp(bytes, readback, 6) == 0);
    char line[64];
    assert(fgets(line, sizeof(line), stdin));
    assert(strcmp(line, "spaces and symbols & 42\n") == 0);
    puts("C edges OK");
    return 0;
}
