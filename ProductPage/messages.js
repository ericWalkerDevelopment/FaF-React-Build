/*
 * ProductPage Messages
 *
 * This contains all the text for the ProductPage component.
 */
import { defineMessages } from 'react-intl'

export default defineMessages({
  product_1: {
    id: 'app.containers.ProductPage.productClientError',
    defaultMessage: 'Failed To Get Product.',
  },
  product_404: {
    id: 'app.containers.ProductPage.productNotFound',
    defaultMessage: 'Product Not Found.',
  },
  product_500: {
    id: 'app.containers.ProductPage.productServerError',
    defaultMessage: 'Get Product Failed.',
  },
  related_1: {
    id: 'app.containers.ProductPage.relatedClientError',
    defaultMessage: 'Failed To Get Related Products.',
  },
  related_404: {
    id: 'app.containers.ProductPage.relatedNotFound',
    defaultMessage: 'Related Products Not Found.',
  },
  related_500: {
    id: 'app.containers.ProductPage.relatedServerError',
    defaultMessage: 'Get Related Products Failed.',
  },
})
