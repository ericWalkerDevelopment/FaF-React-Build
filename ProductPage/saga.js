import _ from 'lodash'
import { takeEvery, takeLatest, call, put, select } from 'redux-saga/effects'
import * as log from 'loglevel'

import request from '../../utils/request'
import logger from '../../utils/logger'
import config from '../../config'
import { SELECT_STORE } from '../App/constants'
import { makeSelectCurrentStore, makeSelectUser } from '../App/selectors'
import {
  SELECT_VARIATION,
  GET_PRODUCT_REQUEST,
  GET_RELATED_REQUEST,
} from './constants'
import {
  getProductSuccess,
  getProductFailure,
  getRelatedSuccess,
  getRelatedFailure,
  selectVariationAction,
} from './actions'
import { makeSelectProduct, makeSelectVariation } from './selectors'

// Individual exports for testing
export function* getProduct(action) {
  const productId = action.payload
  const requestURL = `${config.API_BASE}/products/${productId}?showOnWeb=yes`

  try {
    const user = yield select(makeSelectUser())
    const store = yield select(makeSelectCurrentStore())
    const product = yield call(request, requestURL)
    logger(config.LOGS.TYPES.EVENT, {
      action: config.LOGS.ACTIONS.SELECT,
      category: config.LOGS.CATEGORY.SELECTED_PRODUCT,
      label:
        `Name: ${product.name} - ` +
        `ID: ${product.id} - ` +
        `Category: ${product.category} - ` +
        `LP: ${product.licensedProducer} - ` +
        `Brand: ${product.brand}`,
      product_name: product.name,
      product_id: product.id,
      product_category: product.category,
      product_lp: product.licensedProducer,
      product_brand: product.brand,
      user,
    })
    const minStock = store === config.ONLINE_LOCATION_ID ? 1 : 5
    const variation = Math.max(
      0,
      _.findIndex(
        product.variations,
        v => _.get(v, ['availability', store, 'quantity']) > minStock,
      ),
    )
    yield put(selectVariationAction(variation))
    const availableVariations = getAvailableVariations(
      store,
      product.variations,
      product.variations[variation],
      product.variationLabels,
      product.variationValues,
    )
    yield put(getProductSuccess({ ...product, availableVariations }))
  } catch (err) {
    log.debug(err.message)
    log.trace(err.stack)
    yield put(getProductFailure(_.get(err, ['response', 'status']) || 1))
  }
}

export function* getRelated(action) {
  const productId = action.payload
  const requestURL = `${config.API_BASE}/products/${productId}/related`

  try {
    const products = yield call(request, requestURL)
    yield put(getRelatedSuccess(products))
  } catch (err) {
    log.debug(err.message)
    log.trace(err.stack)
    yield put(getRelatedFailure(_.get(err, ['response', 'status']) || 1))
  }
}

export function* storeChange(action) {
  const store = action.payload
  const product = yield select(makeSelectProduct())
  const selected = yield select(makeSelectVariation())
  if (!store || !product || !selected) return
  const availableVariations = getAvailableVariations(
    store,
    product.variations,
    product.variations[selected],
    product.variationLabels,
    product.variationValues,
  )
  yield put(getProductSuccess({ ...product, availableVariations }))
}

export function* variationChange(action) {
  const store = yield select(makeSelectCurrentStore())
  const product = yield select(makeSelectProduct())
  const user = yield select(makeSelectUser())
  const selected = action.payload.index
  if (!store || !product || typeof selected !== 'number' || selected < 0) return
  const availableVariations = getAvailableVariations(
    store,
    product.variations,
    product.variations[selected],
    product.variationLabels,
    product.variationValues,
  )
  logger(config.LOGS.TYPES.EVENT, {
    action: config.LOGS.ACTIONS.SELECT,
    category: config.LOGS.CATEGORY.SELECTED_VARIATION,
    label: `Name: ${_.get(product.variations, [
      selected,
      'name',
    ])} - ID: ${_.get(product.variations, [selected, 'id'])}`,
    variation_name: _.get(product.variations, [selected, 'name']),
    variation_id: _.get(product.variations, [selected, 'id']),
    product_category: product.category,
    user,
  })
  yield put(getProductSuccess({ ...product, availableVariations }))
}

function getAvailableVariations(
  store,
  variations,
  selected,
  labels,
  values,
  available = {},
) {
  const variation = _.head(variations)
  if (!variation) return flattenAvailableVariations(labels, available, selected)
  const unique = []
  if (variation.colour) {
    const name = _.get(variation, ['colour', 'name'])
    const code = _.get(variation, ['colour', 'code'])
    unique.push(`${name}:${code}`)
  }
  if (variation.size) unique.push(_.get(variation, 'size'))
  if (variation.variationType) unique.push(_.get(variation, 'variationType'))
  if (variation.itemsPerPack) {
    const itemsPerPack = _.get(variation, 'itemsPerPack')
    unique.push(itemsPerPack && itemsPerPack.toString())
  }
  if (!_.isEmpty(variation.netContent)) {
    const value = _.get(variation, ['netContent', 'value'])
    unique.push(value && value.toString())
  }
  if (unique.length === 0) unique.push(_.get(variation, 'name'))
  const showOnWeb = _.get(values, unique)
  const minStock = store === config.ONLINE_LOCATION_ID ? 1 : 5
  const inStock =
    _.get(variation, ['availability', store, 'quantity']) > minStock
  return getAvailableVariations(
    store,
    _.tail(variations),
    selected,
    labels,
    values,
    _.setWith(available, unique, showOnWeb && inStock, Object),
  )
}

function flattenAvailableVariations(
  labels,
  available,
  selected,
  flattened = [],
) {
  const label = _.head(labels)
  if (!label) return flattened

  let nested
  if (label === 'colour') {
    const name = _.get(selected, ['colour', 'name'])
    const code = _.get(selected, ['colour', 'code'])
    nested = _.get(available, `${name}:${code}`)
  } else if (label === 'netContent') {
    const value = _.get(selected, ['netContent', 'value'])
    nested = _.get(
      available,
      (value && value.toString()) || _.get(selected, 'name'),
    )
  } else {
    const value = _.get(selected, label)
    nested = _.get(available, value && value.toString())
  }

  const flat = _.mapValues(available, findAvailability)
  flattened.push(flat)
  return flattenAvailableVariations(_.tail(labels), nested, selected, flattened)
}

function findAvailability(available) {
  if (typeof available === 'boolean') return available
  return _.chain(available)
    .values()
    .map(value => findAvailability(value))
    .reduce((a, b) => a || b)
    .value()
}

export default function* defaultSaga() {
  yield takeLatest(GET_PRODUCT_REQUEST, getProduct)
  yield takeLatest(GET_RELATED_REQUEST, getRelated)
  yield takeEvery(SELECT_STORE, storeChange)
  yield takeEvery(SELECT_VARIATION, variationChange)
}
