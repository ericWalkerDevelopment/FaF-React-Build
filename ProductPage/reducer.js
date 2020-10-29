/*
 *
 * ProductPage reducer
 *
 */

import { fromJS } from 'immutable'
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

const initialState = fromJS({
  getProduct: {
    error: null,
    pending: false,
  },
  getRelated: {
    error: null,
    pending: false,
  },
  product: null,
  related: [],
  image: 0,
  variation: 0,
})

function productPageReducer(state = initialState, action) {
  switch (action.type) {
    case GET_PRODUCT_REQUEST:
      return state.setIn(['getProduct', 'pending'], true)
    case GET_PRODUCT_SUCCESS:
      return state
        .setIn(['getProduct', 'pending'], false)
        .setIn(['getProduct', 'error'], null)
        .set('product', fromJS(action.payload))
    case GET_PRODUCT_FAILURE:
      return state
        .setIn(['getProduct', 'pending'], false)
        .setIn(['getProduct', 'error'], action.payload)
    case GET_RELATED_REQUEST:
      return state.setIn(['getRelated', 'pending'], true)
    case GET_RELATED_SUCCESS:
      return state
        .setIn(['getRelated', 'pending'], false)
        .setIn(['getRelated', 'error'], null)
        .set('related', fromJS(action.payload))
    case GET_RELATED_FAILURE:
      return state
        .setIn(['getRelated', 'pending'], false)
        .setIn(['getRelated', 'error'], action.payload)
    case SELECT_IMAGE:
      return state.set('image', action.payload)
    case SELECT_VARIATION:
      return state.set('variation', action.payload.index).set('image', 0)
    case CLEAR_PRODUCT:
      return initialState
    default:
      return state
  }
}

export default productPageReducer
