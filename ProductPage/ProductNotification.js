import styled from 'styled-components'
import { rgba } from 'polished'
import { BRAND_SECONDARY, ANIMATED, FADE_IN } from '@hifyreinc/faf-styles'

const ProductNotification = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${rgba(BRAND_SECONDARY, 0.75)};
  color: #FFF;
  font-size: 1.5em;
  ${ANIMATED}
  animation-name: ${FADE_IN};
  z-index: 1050;
`

export default ProductNotification
