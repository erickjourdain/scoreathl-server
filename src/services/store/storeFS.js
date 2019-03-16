import shortid from 'shortid'
import fs from 'fs'

const storeFS = ({ stream, filename }) => {
  const id = shortid.generate()
  const pathname = `${__publicdir}/images`
  const imagename = `${id}-${filename}`
  return new Promise((resolve, reject) =>
    stream
      .on('error', error => {
        if (stream.truncated)
          // Delete the truncated file.
          fs.unlinkSync(`${pathname}/${imagename}`)
        reject(error)
      })
      .pipe(fs.createWriteStream(`${pathname}/${imagename}`))
      .on('error', error => reject(error))
      .on('finish', () => resolve({ imagename }))
  )
}

export default storeFS
