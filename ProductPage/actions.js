/*
 *
 * ProductPage actions
 *
 */

import {
  GET_PRODUCT_REQUEST,
  GET_PRODUCT_SUCCESS,
  GET_PRODUCT_FAILURE,
  GET_RELATED_REQUEST,
  GET_RELATED_SUCCESS,
  GET_RELATED_FAILURE,
  SELECT_IMAGE,
  SELECT_VARIATION,
  CLEAR_PRODUCT,
} from './constants'

export function getProductRequest(productId) {
  return {
    type: GET_PRODUCT_REQUEST,
    payload: productId,
  }
}

export function getProductSuccess(product) {
  return {
    type: GET_PRODUCT_SUCCESS,
    payload: product,
  }
}

export function getProductFailure(error) {
  return {
    type: GET_PRODUCT_FAILURE,
    payload: error,
  }
}

export function getRelatedRequest(productId) {
  return {
    type: GET_RELATED_REQUEST,
    payload: productId,
  }
}

export function getRelatedSuccess(related) {
  return {
    type: GET_RELATED_SUCCESS,
    payload: related,
  }
}

export function getRelatedFailure(error) {
  return {
    type: GET_RELATED_FAILURE,
    payload: error,
  }
}

export function selectImageAction(index) {
  return {
    type: SELECT_IMAGE,
    payload: index,
  }
}

export function selectVariationAction(index) {
  return {
    type: SELECT_VARIATION,
    payload: { index },
  }
}

export function clearProductAction() {
  return {
    type: CLEAR_PRODUCT,
  }
}
