'use strict'

/*
  USAGE:
  node this_script.js file1.dat file2.dat
*/

const hrstart = process.hrtime()

const fs = require('fs')
const readline = require('readline')

const Buffer_Size = 1024

function fileExists (filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch (err) {
    return false
  }
}

function d2h (d) {
  let s = (+d).toString(16)
  if (s.length < 2) {
    s = '0' + s
  }
  return s.toUpperCase()
}

if (
  process.argv.length === 4 &&
  fileExists(process.argv[2]) &&
  fileExists(process.argv[3])
) {
  fs.writeFileSync('diff.log', '', { encoding: 'utf8', flag: 'w' })
  main()
} else {
  fs.writeFileSync('diff.log', '[Errors]\nInvalid command line.', {
    encoding: 'utf8',
    flag: 'w'
  })
  console.log('Invalid command line.')
  process.exit()
}

async function main () {
  try {
    const spin = spinner_start('Processing... %s', ['|', '/', '—', '\\'])

    const Differences = []

    const fileSize1 = fs.statSync(process.argv[2])['size']
    const fileSize2 = fs.statSync(process.argv[3])['size']

    const fd1 = await openfile(process.argv[2], 'r')
    const fd2 = await openfile(process.argv[3], 'r')

    if (fileSize1 !== fileSize2) {
      spinner_stop(spin, 'Processing... Done\n')
      console.log('These files have a different size')

      fs.writeFileSync(
        'diff.log',
        '[Errors]\nThese files have a different size.',
        {
          encoding: 'utf8',
          flag: 'w'
        }
      )

      return
    }

    fs.writeFileSync('diff.log', '[Differences]\n', {
      encoding: 'utf8',
      flag: 'a'
    })

    let offset = 0

    const parts =
      fileSize1 >= Buffer_Size ? Math.floor(fileSize1 / Buffer_Size) : 0

    for (var i = 0; i < parts; i++) {
      if (Differences.length > 201) {
        break
      }

      const bytes1 = await readbytes(fd1, offset, Buffer_Size)
      const bytes2 = await readbytes(fd2, offset, Buffer_Size)

      if (Buffer.compare(bytes1, bytes2) !== 0) {
        let arr1 = [...bytes1]
        let arr2 = [...bytes2]

        for (var i = 0; i < arr1.length; i++) {
          if (arr1[i] !== arr2[i]) {
            Differences.push({
              offset: d2h(offset),
              byte1: d2h(arr1[i]),
              byte2: d2h(arr2[i])
            })

            if (Differences.length > 201) {
              break
            }
          }

          offset++
        }
      } else {
        offset += Buffer_Size
      }
    }

    const last_chunk_length =
      fileSize1 > Buffer_Size ? fileSize1 % Buffer_Size : fileSize1

    if (Differences.length < 201 && last_chunk_length > 0) {
      const bytes1 = await readbytes(fd1, offset, last_chunk_length)
      const bytes2 = await readbytes(fd2, offset, last_chunk_length)

      if (Buffer.compare(bytes1, bytes2) !== 0) {
        let arr1 = [...bytes1]
        let arr2 = [...bytes2]

        for (var i = 0; i < arr1.length; i++) {
          if (arr1[i] !== arr2[i]) {
            Differences.push({
              offset: d2h(offset),
              byte1: d2h(arr1[i]),
              byte2: d2h(arr2[i])
            })

            if (Differences.length > 201) {
              break
            }
          }

          offset++
        }
      }
    }

    await closefile(fd1)
    await closefile(fd2)

    for (let v of Differences) {
      fs.writeFileSync(
        'diff.log',
        `0x${v.offset}\t0x${v.byte1}\t0x${v.byte2}\n`,
        { encoding: 'utf8', flag: 'a' }
      )
    }

    spinner_stop(spin, 'Processing... Done\n')

    const hrend = process.hrtime(hrstart)
    console.log(
      `\nExecution time: ${hrend[0]}.${Math.floor(hrend[1] / 1000000)}\n`
    )

    if (Differences.length > 200) {
      console.log(`Bytes differs: >200`)
      fs.writeFileSync('diff.log', `\nBytes differs: >200\n`, {
        encoding: 'utf8',
        flag: 'a'
      })
    } else {
      console.log(`Bytes differs: ${Differences.length}`)
      fs.writeFileSync('diff.log', `\nBytes differs: ${Differences.length}\n`, {
        encoding: 'utf8',
        flag: 'a'
      })
    }

    console.log(`See diff.log for details`)
  } catch (err) {
    console.log(err)
  }
}

function openfile (path, flag) {
  return new Promise((resolve, reject) => {
    fs.open(path, flag, (err, fd) => {
      if (err) reject(err)
      resolve(fd)
    })
  })
}

function closefile (fd) {
  return new Promise((resolve, reject) => {
    fs.close(fd, err => {
      if (err) reject(err)
      resolve()
    })
  })
}

function readbytes (fd, offset, length) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.alloc(length)
    fs.read(fd, buf, 0, length, offset, (err, bytesRead, buf) => {
      if (err) reject(err)
      resolve(buf)
    })
  })
}

function spinner_start (msg, arr, time) {
  return setInterval(() => {
    readline.cursorTo(process.stdout, 0)
    readline.clearLine(process.stdout, 0)
    process.stdout.write(msg.replace(/%s/, arr[0]))
    arr.push(arr.shift())
  }, time || 300)
}

function spinner_stop (id, msg) {
  clearInterval(id)

  readline.cursorTo(process.stdout, 0)
  readline.clearLine(process.stdout, 0)

  if (msg !== undefined) {
    process.stdout.write(msg)
  }
}
