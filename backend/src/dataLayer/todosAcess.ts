import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
// import { TodoUpdate } from '../models/TodoUpdate'
import { DeleteTodoRequest } from '../requests/DeleteItemRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

// TODO: Implement the dataLayer logic
export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly TODOS_CREATED_AT_INDEX = process.env
      .TODOS_CREATED_AT_INDEX,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getUserTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all groups')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.TODOS_CREATED_AT_INDEX,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(newItem: TodoItem): Promise<TodoItem> {
    newItem.attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${newItem.todoId}`

    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: newItem
      })
      .promise()

    return newItem
  }

  async deleteTodo(key: DeleteTodoRequest): Promise<DeleteTodoRequest> {
    try {
      await this.docClient
        .delete({
          TableName: this.todosTable,
          Key: key
        })
        .promise()
    } catch (error) {
      logger.error('Error deleting Todo', error)
    }

    return key
  }
  async updateTodo(
    updatedTodo: UpdateTodoRequest,
    key: DeleteTodoRequest
  ): Promise<Partial<TodoItem>> {
    try {
      const newTodo = {
        ':name': updatedTodo.name,
        ':dueDate': updatedTodo.dueDate,
        ':done': updatedTodo.done
      }

      const params = {
        TableName: this.todosTable,
        Key: key,
        UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: newTodo,
        ReturnValues: 'ALL_NEW'
      }

      await this.docClient.update(params).promise()
    } catch (error) {
      logger.error('Error deleting Todo', error)
    }

    return key
  }

  getUploadUrl(todoId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: parseInt(this.urlExpiration)
    })
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    // @ts-ignore
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  //   @ts-ignore
  return new XAWS.DynamoDB.DocumentClient()
}
