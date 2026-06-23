import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { listingPreviewImages, uniqueImageUrls } from '../../src/domain/images'

describe('imagens dos anuncios', () => {
  it('remove variacoes de tamanho da mesma foto do QuintoAndar', () => {
    const urls = [
      'https://www.quintoandar.com.br/img/med/893463643-29.84505798637871RuaCristal210303SantaTereza12.JPG',
      'https://www.quintoandar.com.br/img/xsm/893463643-29.84505798637871RuaCristal210303SantaTereza12.JPG',
      'https://www.quintoandar.com.br/img/sml/893463643-29.84505798637871RuaCristal210303SantaTereza12.JPG',
      'https://www.quintoandar.com.br/img/med/893463643-995.8356741132358RuaCristal210303SantaTereza10.JPG',
    ]

    assert.deepEqual(uniqueImageUrls(urls), [
      'https://www.quintoandar.com.br/img/med/893463643-29.84505798637871RuaCristal210303SantaTereza12.JPG',
      'https://www.quintoandar.com.br/img/med/893463643-995.8356741132358RuaCristal210303SantaTereza10.JPG',
    ])
  })

  it('usa miniaturas somente quando elas sao fotos distintas da principal', () => {
    const preview = listingPreviewImages([
      'https://www.quintoandar.com.br/img/med/895482177-74.83274543954488IMG0346.jpg',
      'https://www.quintoandar.com.br/img/xsm/895482177-74.83274543954488IMG0346.jpg',
      'https://www.quintoandar.com.br/img/med/original895482177-31.874548845108986IMG0347.jpg',
      'https://www.quintoandar.com.br/img/xsm/original895482177-31.874548845108986IMG0347.jpg',
      'https://cozy-assets.quintoandar.com.br/cozy-static/v3/latest/default/logo/QuintoAndar/default/symbol.pt-BR.svg',
      "https://www.quintoandar.com.br/imovel/895482177/alugar/%3csvg%20xmlns='http://www.w3.org/2000/svg'%3e",
      'https://www.quintoandar.com.br/img/med/original895482177-51.004IMG0348.jpg',
    ])

    assert.equal(preview.primary, 'https://www.quintoandar.com.br/img/med/895482177-74.83274543954488IMG0346.jpg')
    assert.deepEqual(preview.thumbnails, [
      'https://www.quintoandar.com.br/img/med/original895482177-31.874548845108986IMG0347.jpg',
      'https://www.quintoandar.com.br/img/med/original895482177-51.004IMG0348.jpg',
    ])
  })
})
