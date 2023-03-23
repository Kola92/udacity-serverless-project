import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'

import { createAttachmentPresignedUrl } from '../../helpers/todos'
// import { getUserId } from '../utils'

const logger = createLogger('todoAccess')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(event)
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id

    const presignedurl = await createAttachmentPresignedUrl(todoId)

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: presignedurl
      })
    }

    // return presignedurl;
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
