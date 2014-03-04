
module.exports = {
  findLinks: findLinks
}

var linkRxs = {
  '(https://)?(familysearch\\.org/pal:/([^/]+)/([A-Z0-9a-z-]+))': {
    title: 'Record ($3/$4)',
    href: 'https://$2'
  },
  '(https://)?(familysearch\\.org/tree/#view=ancestor&person=([A-Z0-9]{4}-[A-Z0-9]{3}))': {
    title: 'Person ($3)',
    href: 'https://$2'
  },
  '\\b[A-Z0-9]{4}-[A-Z0-9]{3}\\b': {
    title: 'Person ($0)',
    href: 'https://familysearch.org/tree/#view=ancestor&person=$0'
  }
}

function fillMatch(text, match) {
  return text.replace(/\$(\d+)/g, function (full, num) {
    return match[+num]
  })
}

function nextForRx(text, rx) {
  var match = text.match(new RegExp(rx))
  if (!match) return false
  return [text.slice(0, match.index), text.slice(match.index + match[0].length), fillMatch(linkRxs[rx].href, match), fillMatch(linkRxs[rx].title, match)]
}

function findLinks(text) {
  var chunks = [text]
  for (var rx in linkRxs) {
    chunks = doRx(chunks, rx)
  }
  return chunks
}

function findRx(text, rx) {
  var chunks = []
    , next
  while (next = nextForRx(text, rx)) {
    chunks.push(next[0])
    text = next[1]
    chunks.push(next.slice(2))
  }
  if (text.length) chunks.push(text)
  return chunks
}

function doRx(chunks, rx) {
  var res = []
  for (var i in chunks) {
    if (Array.isArray(chunks[i])) {
      res.push(chunks[i])
      continue;
    }
    res = res.concat(findRx(chunks[i], rx))
  }
  return res
}


