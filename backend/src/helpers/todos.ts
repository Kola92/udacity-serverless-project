import { TodoAccess } from './todosAcess'
// import { AttachmentUtils } from './attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import { DeleteTodoRequest } from '../requests/DeleteItemRequest'
// --------------------------------------

// import { TodoAccess } from '../dataLayer/todoAccess'
// import { TodoItem } from '../models/TodoItem'
// import { CreateTodoRequest } from '../requests/CreateTodoRequest'
// import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

// const todosAccess = new TodoAccess()

// TODO: Implement businessLogic

const todosAccess = new TodoAccess()
// const attachmentUtils = new AttachmentUtils()
// const logger = createLogger('todos')

export const getUserTodo = async (userId: string): Promise<TodoItem[]> => {
  return await todosAccess.getUserTodos(userId)
}

export const createTodo = async (
  CreateTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> => {
  const itemId = uuid.v4()

  return await todosAccess.createTodo({
    userId: userId,
    todoId: itemId,
    createdAt: new Date().toISOString(),
    name: CreateTodoRequest.name,
    dueDate: CreateTodoRequest.dueDate,
    done: false,
    attachmentUrl: ''
  })
}

export const deleteTodo = async (
  DeleteTodoRequest: DeleteTodoRequest
): Promise<DeleteTodoRequest> => {
  return await todosAccess.deleteTodo({
    todoId: DeleteTodoRequest.todoId,
    userId: DeleteTodoRequest.userId
  })
}

export const updateTodo = async (
  key: DeleteTodoRequest,
  updateTodoRequest: UpdateTodoRequest
): Promise<Partial<TodoItem>> => {
  const keys: DeleteTodoRequest = {
    todoId: key.todoId,
    userId: key.userId
  }
  const updateBody = {
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  }
  return await todosAccess.updateTodo(updateBody, keys)
}

export const createAttachmentPresignedUrl = async (todoId: string) => {
  return todosAccess.getUploadUrl(todoId)
}
