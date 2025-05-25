import { Subtitle } from '../types'

const parse = (xml: string): Subtitle[] => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xml, 'text/xml')
  const textNodes = xmlDoc.getElementsByTagName('text')

  return Array.from(textNodes).map((node) => ({
    begin: parseFloat(node.getAttribute('start') || '0'),
    end:
      parseFloat(node.getAttribute('start') || '0') +
      parseFloat(node.getAttribute('dur') || '0'),
    text: node.textContent
      ? node.textContent
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
      : '',
  }))
}

export default parse
