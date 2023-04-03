import { TodosAccess } from '../dataLayer/todosAccess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import { createLogger } from '../utils/logger'
import { AttachmentUtils } from '../helpers/attachmentUtils'
import * as createError from 'http-errors'

// TODO: Implement businessLogic

const todosAccess = new TodosAccess()
const logger = createLogger('todos')
const attachmentUtils = new AttachmentUtils()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  logger.info('Getting all todos for user', { userId })
  return todosAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4()
  const attachmentUrl = attachmentUtils.getAttachmentUrl(todoId)

  const newTodo: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    attachmentUrl,
    done: false,
    ...createTodoRequest
  }

  logger.info('Creating new todo', { newTodo })
  return await todosAccess.createTodoItem(newTodo)
}

export async function deleteTodo(
  todoId: string,
  userId: string
): Promise<void> {
  logger.info('Deleting todo', { todoId })
  await todosAccess.deleteTodoItem(todoId, userId)
}

export async function updateTodo(
  todoId: string,
  updateTodoRequest: UpdateTodoRequest,
  userId: string
): Promise<void> {
  logger.info('Updating todo', { todoId, updateTodoRequest })
  await todosAccess.updateTodoItem(todoId, updateTodoRequest, userId)
}

export async function generatePresignedUrl(
  todoId: string,
  userId: string
): Promise<string> {
  logger.info('Generating upload url', { todoId })
  const todo = await todosAccess.getTodoItem(todoId, userId)
  if (!todo) {
    throw new createError.NotFound(`Todo with id ${todoId} not found`)
  } else if (todo.userId !== userId) {
    throw new createError.Unauthorized(
      `User ${userId} is not authorized to access todo ${todoId}`
    )
  } else if (todo.attachmentUrl) {
    throw new createError.BadRequest(`Todo ${todoId} already has an attachment`)
  } else {
    logger.info('Todo exists and has no attachment', { todoId })
  }

  return await attachmentUtils.getUploadUrl(todoId)
}

export async function updateTodoAttachmentUrl(
  todoId: string,
  userId: string
): Promise<void> {
  logger.info('Updating todo attachment url', { todoId })
  const attachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  await todosAccess.updateTodoAttachmentUrl(todoId, attachmentUrl, userId)
}

export const createAttachmentPresignedUrl = async (todoId: string) => {
  return await attachmentUtils.getUploadUrl(todoId)
}
