NodeDiff
==========

Node.js script for comparing two files byte by byte.

One of possible application of this script is to check correctness of patching.


## Usage

Command line:

```
node this_script.js file1.dat file2.dat
```

All information about errors and differences is written to the log file, diff.log

Output example (diff.log):

```
[Differences]
0xD538	0x38	0x08
0xD539	0x00	0x01
0xEB83	0x00	0x01
0x460B5	0x53	0xC3

Bytes differs: 4
```

Explanation:

```
first column  - offset
second column - file1.dat (value of a byte in hexadecimal representation)
third column  - file2.dat (-)
```

### Attention

1. If the files have different sizes, then the script displays only a message about that and exits.

2. The script makes a report only of 200 first differences.


<hr>
