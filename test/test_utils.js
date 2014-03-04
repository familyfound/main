
var expect = require('expect.js')
  , utils = require('../lib/utils')

var links = [
  ['Possible source: https://familysearch.org/pal:/MM9.1.1/M8P5-MML, But there\'s also this person KWHZ-3D1 or this other one https://familysearch.org/tree/#view=ancestor&person=KWHZ-3D1',
    [
      'Possible source: ',
      ['https://familysearch.org/pal:/MM9.1.1/M8P5-MML', 'Record (MM9.1.1/M8P5-MML)'],
      ', But there\'s also this person ',
      ['https://familysearch.org/tree/#view=ancestor&person=KWHZ-3D1', 'Person (KWHZ-3D1)'],
      ' or this other one ',
      ['https://familysearch.org/tree/#view=ancestor&person=KWHZ-3D1', 'Person (KWHZ-3D1)'],
    ]
  ],
  ['Trying without the prefix familysearch.org/pal:/MM9.1.1/M8P5-MML; does that work? And familysearch.org/tree/#view=ancestor&person=KWHZ-3D1',
    [
      'Trying without the prefix ',
      ['https://familysearch.org/pal:/MM9.1.1/M8P5-MML', 'Record (MM9.1.1/M8P5-MML)'],
      '; does that work? And ',
      ['https://familysearch.org/tree/#view=ancestor&person=KWHZ-3D1', 'Person (KWHZ-3D1)'],
    ]
  ],
]

describe('findLinks', function () {
  links.forEach(function (one, i) {
    it('should parse ' + i, function () {
      expect(utils.findLinks(one[0])).to.eql(one[1])
    })
  })
})

