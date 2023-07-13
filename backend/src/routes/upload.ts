import { randomUUID } from 'node:crypto'

import { FastifyInstance } from 'fastify'
import { createWriteStream } from 'node:fs'
import { extname, resolve } from 'node:path'

import { promisify } from 'node:util'
import { pipeline } from 'node:stream'

const pump = promisify(pipeline)

export async function uploadRoute(fastify: FastifyInstance) {
  fastify.post('/upload', async (request, reply) => {
    const upload = await request.file({
      limits: {
        fileSize: 5_242_880 //5mb
      }
    })
    if (!upload) {
      return reply.status(400).send()
    }

    if (upload.filename.length === 0) {
      return null
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/
    const isValidFileFormat = mimeTypeRegex.test(upload.mimetype)

    if (!isValidFileFormat) {
      return reply.status(400).send()
    }
    const fileId = randomUUID()
    const extension = extname(upload.filename)

    const fileName = fileId.concat(extension)

    const writeStream = createWriteStream(
      resolve(__dirname, '../../uploads/', fileName)
    )
    await pump(upload.file, writeStream)

    const fullUrl = request.protocol.concat('://').concat(request.hostname)

    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString()

    return { fileUrl }
  })
}
