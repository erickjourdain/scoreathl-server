import { findIndex, find } from 'lodash'

export const success = (res, status) => (entity) => {
  if (entity) {
    res.status(status || 200).json(entity)
  }
  return null
}

export const notFound = (res) => (entity) => {
  if (entity) {
    return entity
  }
  res.status(404).end()
  return null
}

export const authorOrAdmin = (res, user, userField) => (entity) => {
  if (entity) {
    const isAdmin = user.role === 'admin'
    const isAuthor = entity[userField] && entity[userField].equals(user.id)
    if (isAuthor || isAdmin) {
      return entity
    }
    res.status(401).end()
  }
  return null
}

export const rolesOrAdmin = (user, roles) => {
  if (!user) {
    return false
  }
  if (user.role = 'admin' || find(roles, user.role)) {
    return true
  }
  return false
}

export const authorisedOrAdmin = (user, userField) => (entity) => {
  if (entity) {
    const isAdmin = user.role === 'admin'
    const isAuthorised = (entity[userField] && findIndex(entity[userField], { id: user.id }) >= 0)
    if (isAuthorised || isAdmin) {
      return true
    }
    false
  }
  return false
}
