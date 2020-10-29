/**
 *
 * ProductPage
 *
 */

import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { compose } from 'redux'
import { Grid, Row, Col, ProgressBar } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { rgba } from 'polished'
import styled, { css } from 'styled-components'
import qs from 'qs'
import {
  ProductCard,
  Label,
  H2,
  JumboLink,
  Breadcrumb,
  Spinner,
} from '@hifyreinc/faf-components'
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  COVER_BACKGROUND,
  GRAY_LIGHT,
  SCREEN_XS_MAX,
  SCREEN_SM_MIN,
  SCREEN_SM_MAX,
  SCREEN_MD_MIN,
  SCREEN_LG_MIN,
} from '@hifyreinc/faf-styles'
import config from 'config'
import injectSaga from 'utils/injectSaga'
import injectReducer from 'utils/injectReducer'
import getCovaImage from 'utils/getCovaImage'
import formatPrice from 'compliance/formatPrice'
import OrderForm from 'containers/OrderForm'
import ProductGrid from 'components/ProductGrid'
import Section from 'components/Section'
import VariationSelector from 'components/VariationSelector'
import {
  makeSelectVerified,
  makeSelectSignedIn,
  makeSelectCurrentProvince,
  makeSelectCurrentStore,
  makeSelectUser,
  makeSelectNavHeight,
} from 'containers/App/selectors'
import { setNavHeightAction } from 'containers/App/actions'
import {
  getProductRequest,
  getRelatedRequest,
  selectVariationAction,
  selectImageAction,
  clearProductAction,
} from './actions'
import {
  makeSelectProduct,
  makeSelectGetProductRequest,
  makeSelectRelated,
  makeSelectImage,
  makeSelectVariation,
} from './selectors'
import reducer from './reducer'
import saga from './saga'
import messages from './messages'
import FAFbg from './faf-bg.svg'
import logger from '../../utils/logger'
import caryophyllene from './terpene-icons/caryophyllene.svg'
import humulene from './terpene-icons/humulene.svg'
import limonene from './terpene-icons/limonene.svg'
import myrcene from './terpene-icons/myrcene.svg'
import pinene from './terpene-icons/pinene.svg'
import terpinolene from './terpene-icons/terpinolene.svg'
import { GRID_GUTTER, FONT_WEIGHT_BOLD } from '../../global-styles'

/* eslint-disable react/prefer-stateless-function */
export class ProductPage extends React.PureComponent {
  constructor(props) {
    super(props)
    this.handleVariationChange = this.handleVariationChange.bind(this)
    this.handleVariationChangeByName = this.handleVariationChangeByName.bind(
      this,
    )
    this.renderVariationSelectors = this.renderVariationSelectors.bind(this)
    this.renderTerpenes = this.renderTerpenes.bind(this)
    this.filterTerpenes = this.filterTerpenes.bind(this)
  }
  componentDidMount() {
    const { location, user } = this.props
    logger(config.LOGS.TYPES.PAGE_VIEW, {
      page: location.pathname + location.search,
      user,
    })
  }
  componentWillMount() {
    const { match, getProduct, getRelated } = this.props

    const productId = _.last(match.params.id.split('-'))
    getProduct(productId)
    getRelated(productId)
  }

  componentWillReceiveProps(nextProps) {
    const prevProps = this.props
    const { match, getProduct, getRelated } = nextProps
    const prevProductId = _.last(prevProps.match.params.id.split('-'))
    const productId = _.last(match.params.id.split('-'))
    if (prevProductId !== productId) {
      getProduct(productId)
      getRelated(productId)
    }
  }

  componentWillUnmount() {
    this.props.clearProduct()
  }

  makeVariationObject(variation, includeName = false) {
    const netContent = _.get(variation, ['netContent', 'value'])
    const itemsPerPack = _.get(variation, 'itemsPerPack')
    const name = _.get(variation, ['colour', 'name'])
    const code = _.get(variation, ['colour', 'code'])
    const variationObject = {
      name: includeName && _.get(variation, 'name'),
      size: _.get(variation, 'size'),
      colour: name && code && `${name}:${code}`,
      itemsPerPack: itemsPerPack && itemsPerPack.toString(),
      variationType: _.get(variation, 'variationType'),
      netContent: netContent && netContent.toString(),
    }
    return variationObject
  }

  handleVariationChange(type, selected) {
    const { product, variation, selectVariation } = this.props
    const variationSpecs = this.makeVariationObject(
      _.get(product, ['variations', variation]),
      type === 'name',
    )
    const nextSpecs = _.set(variationSpecs, type, selected)
    const nextVariation = _.findIndex(product.variations, v =>
      _.isEqual(this.makeVariationObject(v, type === 'name'), nextSpecs),
    )
    if (nextVariation >= 0) selectVariation(nextVariation)
  }

  handleVariationChangeByName(type, selected) {
    const { product, selectVariation } = this.props
    const nextVariation = _.findIndex(
      product.variations,
      v => v.name === selected,
    )
    if (nextVariation >= 0) selectVariation(nextVariation)
  }

  renderVariationSelectors() {
    const { product, variation } = this.props
    if (product.variations.length < 1) return ''
    const v = _.get(product, ['variations', variation])
    return _.chain(product)
      .get('variationLabels')
      .zip(_.get(product, 'availableVariations'))
      .map(([label, variations]) => {
        /* eslint-disable indent */
        const properLabel =
          product.category === 'Accessories'
            ? 'Please Choose:'
            : _.snakeCase(label)
                .split('_')
                .join(' ')
        /* eslint-enable */
        const unit = label === 'netContent' && _.get(v, ['netContent', 'unit'])
        const param = label === 'netContent' ? ['netContent', 'value'] : label

        const sortedVariations = _.chain(variations)
          .toPairs()
          .sortBy([
            ([value]) => {
              if (label === 'size') {
                switch (value) {
                  case 'XS':
                    return 0
                  case 'S':
                    return 1
                  case 'M':
                    return 2
                  case 'L':
                    return 3
                  case 'XL':
                    return 4
                  case 'XXL':
                    return 5
                  case 'XXXL':
                    return 6
                  default:
                    return 7
                }
              } else if (label === 'netContent' || label === 'itemsPerPack') {
                return parseFloat(value)
              } else {
                return value
              }
            },
          ])
          .value()
        return (
          <VariationWrapper key={label} block={label === 'colour'}>
            {label === 'colour' ? (
              [
                <ColourPickerLabel>{properLabel}</ColourPickerLabel>,
                <VariationSelector
                  align="center"
                  variations={sortedVariations}
                  unit={unit}
                  type={label}
                  selected={_.get(v, param)}
                  onChange={this.handleVariationChange}
                />,
              ]
            ) : (
              <Label>
                {properLabel}
                <VariationSelector
                  align={product.category === 'Accessories' ? 'left' : 'center'}
                  variations={sortedVariations}
                  unit={unit}
                  type={label}
                  selected={_.get(v, param)}
                  onChange={
                    product.category === 'Accessories'
                      ? this.handleVariationChangeByName
                      : this.handleVariationChange
                  }
                />
              </Label>
            )}
          </VariationWrapper>
        )
      })
      .value()
  }

  renderConcentration(name, concentration) {
    if (_.isEmpty(concentration)) return ''
    const { min, max, unit } = concentration
    if (!min || !max) return ''
    let range
    if (!max || min === max) range = `${min}${unit}`
    else if (!min) range = `<${max}${unit}`
    else range = `${min} - ${max}${unit}`
    return (
      <FlexCol>
        <Label>{name}</Label>
        <p>{range}</p>
      </FlexCol>
    )
  }

  renderField(name, field) {
    if (!field) return ''
    return (
      <FlexCol>
        <Label>{name}</Label>
        <p>{field}</p>
      </FlexCol>
    )
  }

  filterTerpenes(terpeneType) {
    if (terpeneType.includes('Caryophyllene')) {
      return (
        <span>
          <img src={caryophyllene} alt="Caryophyllene" />
        </span>
      )
    } else if (terpeneType.includes('Humulene')) {
      return (
        <span>
          <img src={humulene} alt="Humulene" />
        </span>
      )
    } else if (terpeneType.includes('Limonene')) {
      return (
        <span>
          <img src={limonene} alt="Limonene" />
        </span>
      )
    } else if (terpeneType.includes('Myrcene')) {
      return (
        <span>
          <img src={myrcene} alt="Myrcene" />
        </span>
      )
    } else if (terpeneType.includes('Pinene')) {
      return (
        <span>
          <img src={pinene} alt="Pinene" />
        </span>
      )
    } else if (terpeneType.includes('Terpinolene')) {
      return (
        <span>
          <img src={terpinolene} alt="Terpinolene" />
        </span>
      )
    }
    return ''
  }

  renderTerpenes() {
    const { product, variation } = this.props
    const terpenes = _.chain(product)
      .get(['variations', variation, 'terpenes'])
      .filter(t => t.content)
      .value()
    if (!terpenes || terpenes.length === 0) return ''
    return (
      <FlexCol big>
        <Label>Terpenes</Label>
        <Table>
          <TableBody>
            {_.map(terpenes, t => (
              <TableRow>
                <TableCell>
                  {this.filterTerpenes(t.type)}
                  {t.type}
                </TableCell>
                <TableCell full>
                  <ProgressBar now={t.content} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FlexCol>
    )
  }

  renderProductSection() {
    const {
      product,
      variation,
      storeId,
      selectedImage,
      selectImage,
      getProductStatus,
      verified,
      province,
      navHeight,
    } = this.props
    const variationId = _.get(product, ['variations', variation, 'id'])
    // TODO: Lauren style these to improve look of page while loading
    if (getProductStatus.pending || !product) {
      return (
        <Section>
          <Spinner />
        </Section>
      )
    } else if (getProductStatus.error) {
      return (
        <Section>
          <FormattedMessage
            {...messages[`product_${getProductStatus.error}`]}
          />
        </Section>
      )
    }

    const price = (
      <Price>
        {formatPrice(
          _.get(product, [
            'variations',
            variation,
            'pricing',
            storeId,
            'regular',
          ]),
          {
            province,
            category: product.category,
            verified,
          },
        )}
      </Price>
    )

    const crumbs = [
      {
        name: 'All Products',
        link: '/shop',
      },
      {
        name: product.category,
        link: `/shop?category=${product.category}`,
      },
      {
        name: product.subCategory,
        link:
          `/shop?category=${product.category}&` +
          `subCategory=${product.subCategory}`,
      },
    ]
    const variationImages = _.get(product, ['variations', variation, 'images'])
    const images = variationImages || []
    if (images.length === 0 && product.image) images.push(product.image)
    const groups = _.chain([
      ['subCategory', product.subCategory],
      ['strainType', product.strainType],
      ['subStrainType', product.subStrainType],
      ['accessoryType', product.accessoryType],
    ])
      .concat(_.map(product.tags, t => ['tag', t]) || [])
      .filter(g => g[1])
      .map(([key, group]) => {
        const q =
          key === 'tag'
            ? qs.stringify({ tag: group })
            : qs.stringify({ category: product.category, [key]: group })
        return (
          <Link to={`/shop?${q}`}>
            <li>{group}</li>
          </Link>
        )
      })
      .value()
    return [
      <HeaderSection padTop={navHeight}>
        <Grid>
          <BreadcrumbWrapper>
            <Breadcrumb light crumbs={crumbs} />
          </BreadcrumbWrapper>
          <Row>
            <Col md={5}>
              {/* Main Product Image */}

              <ImageWrapper
                hideLogo={getCovaImage(images[selectedImage], 1040)}
              >
                <Image imageUrl={getCovaImage(images[selectedImage], 1040)} />
                {/* Additional Product Images */}
                {images.length > 1 && (
                  <AdditionalPhotos>
                    {images.map((image, index) => (
                      <button key={image} onClick={() => selectImage(index)}>
                        <img
                          className={selectedImage === index ? 'selected' : ''}
                          src={getCovaImage(image, 200)}
                          alt={product.name}
                        />
                      </button>
                    ))}
                  </AdditionalPhotos>
                )}
              </ImageWrapper>
            </Col>

            <Col md={7}>
              <HeaderText>
                <div>
                  <Title>{product.name}</Title>
                  <GroupList>{groups}</GroupList>
                </div>

                {price}
              </HeaderText>
            </Col>
          </Row>
        </Grid>
      </HeaderSection>,
      <BodySection>
        <Grid>
          <Row style={{ clear: 'both' }}>
            <Col md={5}>
              {(product.fullDescription || product.description) && (
                <Description>
                  <Label>Description</Label>
                  <p>{product.fullDescription || product.description}</p>
                </Description>
              )}
            </Col>

            <Col md={7}>
              <BodyText>
                <FlexWrapper>
                  {this.renderConcentration(
                    'THC',
                    _.get(product, ['variations', variation, 'thcContent']),
                  )}
                  {this.renderConcentration(
                    'CBD',
                    _.get(product, ['variations', variation, 'cbdContent']),
                  )}
                  {this.renderField('Strain Name', product.strain)}
                  {this.renderField('Brand Name', product.brand)}
                  {this.renderField('Supplier', product.licensedProducer)}
                  {this.renderTerpenes()}
                </FlexWrapper>

                {this.renderVariationSelectors()}

                <OrderForm variationId={variationId} />
              </BodyText>
            </Col>
          </Row>
        </Grid>
      </BodySection>,
    ]
  }

  renderRelatedSection() {
    const { province, related, storeId, verified } = this.props
    if (!related || related.length < 1) return ''
    return (
      <Section>
        <Grid>
          <FeatureTitle>You may also enjoy</FeatureTitle>

          <StyledProductGrid third>
            {_.map(related, recommendation => {
              const prices = _.chain(recommendation)
                .get('variations')
                .map(v => _.get(v, ['pricing', storeId, 'regular']))
                .sortBy(_.identity)
                .value()
              const formattedPrice = formatPrice(_.head(prices), {
                province,
                category: recommendation.category,
                verified,
              })
              const price =
                prices.length > 1 ? `From ${formattedPrice}` : formattedPrice
              const totalStock = _.chain(recommendation)
                .get('variations')
                .map(v => _.get(v, ['availability', storeId, 'quantity']) || 0)
                .reduce((sum, n) => sum + n, 0)
                .value()
              return (
                <ProductCard
                  key={recommendation.id}
                  id={recommendation.id}
                  title={recommendation.name}
                  imageUrl={getCovaImage(recommendation.image, 650)}
                  subtitle={_.get(recommendation, 'subCategory')}
                  heading=""
                  price={formattedPrice ? price : ''}
                  soldOut={totalStock <= 0}
                />
              )
            })}
          </StyledProductGrid>
        </Grid>
      </Section>
    )
  }

  renderJumboLinks() {
    return (
      <JumboLinkWrapper>
        <JumboLink
          title="Find your local cannabis shop"
          linkText="See locations"
          link="/locations"
          secondary
        />
        <JumboLink
          title="Have burning questions?"
          linkText="FAQ's"
          link="/faq"
        />
      </JumboLinkWrapper>
    )
  }

  render() {
    const { product } = this.props
    return [
      <Helmet>
        <title>{_.get(product, 'name')}</title>
        {/* TODO description
        <meta name="description" content="Description of ProductPage" /> */}
      </Helmet>,
      <div>
        {this.renderProductSection()}
        {/* TODO hidden until hooked up
        {this.renderRelatedSection()} */}
      </div>,
      <section>
        <Grid>{this.renderJumboLinks()}</Grid>
      </section>,
    ]
  }
}

ProductPage.propTypes = {
  signedIn: PropTypes.bool,
  verified: PropTypes.bool,
  selectedImage: PropTypes.number.isRequired,
  variation: PropTypes.number.isRequired,
  storeId: PropTypes.string.isRequired,
  province: PropTypes.string.isRequired,
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    subCategory: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    productType: PropTypes.string,
    strain: PropTypes.string,
    strainType: PropTypes.string,
    subStrainType: PropTypes.string,
    brand: PropTypes.string,
    licensedProducer: PropTypes.string,
    variationTypes: PropTypes.shape({
      size: PropTypes.arrayOf(PropTypes.string),
      colour: PropTypes.arrayOf(PropTypes.string),
      weight: PropTypes.arrayOf(PropTypes.number),
      volume: PropTypes.arrayOf(PropTypes.number),
    }),
    variations: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        primaryImage: PropTypes.string,
        images: PropTypes.arrayOf(PropTypes.string).isRequired,
        equivalentValue: PropTypes.number,
        netContent: PropTypes.shape({
          value: PropTypes.number,
          unit: PropTypes.string,
        }),
        itemsPerPack: PropTypes.number,
        size: PropTypes.string,
        colour: PropTypes.string,
        thcContent: PropTypes.shape({
          min: PropTypes.number,
          max: PropTypes.number,
        }),
        cbdContent: PropTypes.shape({
          min: PropTypes.number,
          max: PropTypes.number,
        }),
        terpenes: PropTypes.arrayOf(
          PropTypes.shape({
            type: PropTypes.string.isRequired,
            content: PropTypes.number,
          }),
        ),
        package: {
          height: PropTypes.number,
          length: PropTypes.number,
          width: PropTypes.number,
          weight: PropTypes.number,
        },
        pricing: PropTypes.objectOf(
          PropTypes.shape({
            regular: PropTypes.number,
          }),
        ).isRequired,
        availability: PropTypes.objectOf(
          PropTypes.shape({
            quantity: PropTypes.number,
          }),
        ).isRequired,
      }),
    ),
  }),
  related: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      subCategory: PropTypes.string.isRequired,
      thcContent: PropTypes.shape({
        min: PropTypes.number,
      }),
      cbdContent: PropTypes.shape({
        min: PropTypes.number,
      }),
      variations: PropTypes.arrayOf(
        PropTypes.shape({
          pricing: PropTypes.objectOf(
            PropTypes.shape({
              regular: PropTypes.number,
            }),
          ).isRequired,
          availability: PropTypes.objectOf(
            PropTypes.shape({
              quantity: PropTypes.number,
            }),
          ).isRequired,
        }),
      ).isRequired,
    }).isRequired,
  ),
  match: PropTypes.object.isRequired,
  getProduct: PropTypes.func.isRequired,
  getProductStatus: PropTypes.shape({
    error: PropTypes.number,
    pending: PropTypes.bool.isRequired,
  }).isRequired,
  getRelated: PropTypes.func.isRequired,
  selectVariation: PropTypes.func.isRequired,
  selectImage: PropTypes.func.isRequired,
  clearProduct: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  user: PropTypes.object,
  navHeight: PropTypes.string,
}

const mapStateToProps = () => state => ({
  verified: makeSelectVerified()(state),
  province: makeSelectCurrentProvince()(state),
  selectedImage: makeSelectImage()(state),
  variation: makeSelectVariation()(state),
  storeId: makeSelectCurrentStore()(state) || config.ONLINE_LOCATION_ID,
  product: makeSelectProduct()(state),
  related: makeSelectRelated()(state),
  getProductStatus: makeSelectGetProductRequest()(state),
  signedIn: makeSelectSignedIn()(state),
  user: makeSelectUser()(state),
  navHeight: makeSelectNavHeight()(state),
})

function mapDispatchToProps(dispatch) {
  return {
    getProduct: productId => dispatch(getProductRequest(productId)),
    getRelated: productId => dispatch(getRelatedRequest(productId)),
    selectVariation: variation => dispatch(selectVariationAction(variation)),
    selectImage: image => dispatch(selectImageAction(image)),
    clearProduct: () => dispatch(clearProductAction()),
    setNavHeight: height => dispatch(setNavHeightAction(height)),
  }
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
)
const withReducer = injectReducer({ key: 'productPage', reducer })
const withSaga = injectSaga({ key: 'productPage', saga })

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(ProductPage)

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const AdditionalPhotos = styled(Wrapper)`
  position: relative;
  padding: ${GRID_GUTTER} 0 ${GRID_GUTTER} ${GRID_GUTTER};
  img {
    height: 60px;
    width: 60px;
    &:hover {
      opacity: 1;
    }
    &.selected {
      border-width: 4px;
    }
    ${SCREEN_XS_MAX} {
      height: 45px;
      width: 45px;
    }
  }
  button {
    margin: ${GRID_GUTTER} ${GRID_GUTTER} 0 0;
    padding: 0;
    background-color: white;
    border: solid 1px ${GRAY_LIGHT};
  }
`

const FeatureTitle = styled(H2)`
  margin-bottom: 0.6em;
  font-size: 2.3em;
  line-height: 1.2;
`

const Title = styled.h1`
  font-size: 1.8em;
  margin-bottom: 8px;
  color: ${BRAND_PRIMARY} !important;
  ${SCREEN_SM_MAX} {
    font-size: 28px;
  }
`

const Price = styled.span`
  display: inline-block;
  font-size: 1.8em;
  font-weight: ${FONT_WEIGHT_BOLD};
  margin-top: 1.3em;
  color: white;
  ${SCREEN_SM_MAX} {
    font-size: 24px;
    margin-top: 0.5em;
    margin-bottom: 1em;
  }
`

const FlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const FlexCol = styled.div`
  white-space: nowrap;
  &:not(:last-child) {
    padding-right: 30px;
  }
  ${props =>
    props.big &&
    css`
      flex-basis: 40%;
      flex-grow: 0;
      ${SCREEN_XS_MAX} {
        flex-basis: 100%;
      }
    `};
  p {
    white-space: nowrap;
    font-size: 0.8em;
  }
`

const BreadcrumbWrapper = styled.div`
  margin: 0 0 1em;
`

const HeaderSection = styled.section`
  background-color: ${BRAND_SECONDARY};
  position: relative;
  clear: both;
  padding-top: calc(${props => props.padTop} + 15px);
  ${SCREEN_MD_MIN} {
    overflow: auto;
    padding-top: calc(${props => props.padTop} + 30px);
    .row {
      height: 250px;
      overflow: visible;
    }
  }
`

const BodySection = styled(HeaderSection)`
  background-color: white;
  overflow: visible;
  .container {
    ${SCREEN_MD_MIN} {
      margin-top: -140px;
    }
    ${SCREEN_LG_MIN} {
      margin-top: -200px;
    }
  }
  .row {
    height: auto;
  }
`

const HeaderText = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  ${SCREEN_MD_MIN} {
    padding-left: 1em;
  }
`

const BodyText = styled.div`
  padding: 1em 0;
  ${SCREEN_MD_MIN} {
    padding-left: 1em;
  }
`

const VariationWrapper = styled.div`
  display: flex;
  z-index: 555;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  flex: 1;
  margin-top: 1em;
  select,
  input {
    margin-top: 8px;
    min-width: 213px;
    max-width: 100%;
    width: auto;
  }
  ${props =>
    props.block &&
    css`
      flex-basis: 100%;
      margin-bottom: 20px;
    `};
  ${SCREEN_SM_MAX} {
    margin-bottom: 20px;
  }
`

const ImageWrapper = styled.div`
  width: 100%;
  background-color: #eee;
  background-image: url("${FAFbg}");
  background-size: 45px;
  background-position: center center;
  border: solid 1px ${GRAY_LIGHT};
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  z-index: 999;
  &:before {
    content: '';
    display: block;
    padding-top: 100%;
  }
  ${props =>
    props.hideLogo &&
    css`
      background-image: none;
      background-color: white;
    `};
`

const Image = styled.div`
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  ${COVER_BACKGROUND};
  background-image: url("${props => props.imageUrl}");
  width: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
`

const GroupList = styled.ul`
  display: flex;
  list-style: none;
  padding: 0;
  -webkit-padding-start: 0;
  flex-wrap: wrap;
  li {
    white-space: nowrap;
    padding: 7px 15px 4px;
    border-radius: 20px;
    color: white;
    background-color: ${rgba('white', 0.15)};
    margin: 0 5px 5px 0;
    cursor: pointer;
    font-size: 0.9em;
    &:hover,
    &:focus {
      background-color: ${rgba('white', 0.3)};
    }
    ${SCREEN_SM_MIN} {
      font-size: 0.75em;
    }
  }
`

const Description = styled.div`
  ${SCREEN_MD_MIN} {
    margin-top: 200px;
  }
  label {
    padding-top: 30px;
  }
  p {
    line-height: 1.8;
    ${SCREEN_MD_MIN} {
      padding-right: 2em;
    }
  }
`

const Table = styled.div`
  display: table;
  width: 100%;
  font-size: 0.8em;
`

const TableBody = styled.div`
  display: table-row-group;
`

const TableRow = styled.div`
  display: table-row;
`

const TableCell = styled.div`
  display: table-cell;
  white-space: nowrap;
  vertical-align: middle;
  width: ${props => (props.full ? '100%' : '1%')};
  span {
    width: 20px;
    height: 15px;
    display: inline-block;
    text-align: center;
    img {
      max-width: 15px;
      max-height: 15px;
      margin-right: 7px;
    }
  }
`

// Limits the Product Grid to only display 3, 2 at SM
const StyledProductGrid = styled(ProductGrid)`
  a:nth-child(n + 4) {
    display: none;
  }
  ${SCREEN_SM_MAX} {
    a:nth-child(n + 3) {
      display: none;
    }
  }
`

const JumboLinkWrapper = styled.div`
  margin: 0 -${GRID_GUTTER};
  display: flex;
  align-items: stretch;
  ${SCREEN_SM_MAX} {
    flex-direction: column;
  }
  a {
    flex: 1;
    margin: 7.5px ${GRID_GUTTER};
  }
`

const ColourPickerLabel = styled(Label)`
  width: auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 2px;
`
