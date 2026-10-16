import decimal
import fractions
import pathlib
import sqlite3
import sys

assert (2**200) ** 2 == 2**400
assert decimal.Decimal('0.1') + decimal.Decimal('0.2') == decimal.Decimal('0.3')
assert fractions.Fraction(1, 3) * 3 == 1
text = 'বাংলা Unicode 🚀'
file = pathlib.Path("python's & unicode.txt")
file.write_text(text, encoding='utf-8')
assert file.read_text(encoding='utf-8') == text
payload = bytes(range(256))
file.write_bytes(payload)
assert file.read_bytes() == payload
with sqlite3.connect(':memory:') as db:
    db.execute('create table values_table (value text)')
    db.execute('insert into values_table values (?)', ("O'Brien & 42",))
    assert db.execute('select value from values_table').fetchone()[0] == "O'Brien & 42"
try:
    [1][99]
    raise AssertionError('missing exception')
except IndexError:
    pass
assert sys.stdin.readline() == 'spaces and symbols & 42\n'
assert sys.stdin.read() == ''
print('Python edges OK')
