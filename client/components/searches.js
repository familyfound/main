
module.exports = {
  searchItems: searchItems,
  fsQuery: fsQuery
}

function getYear(text) {
  return parseInt((text || '').match(/\d{4}/))
}

function fsQuery(person) {
  var display = person.rels.display
    , parts = display.name.split(' ')
    , lastName = parts.pop()
    , firstNames = parts.join(' ')
  var query = '+givenname:"' + firstNames + '"~+surname:"' + lastName + '"~+birth_place:"' + display.birthPlace + '"~'
    , birthYear
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'
  }
  return query
}

function familySearch(person) {
  var display = person.rels.display
    , parts = display.name.split(' ')
    , lastName = parts.pop()
    , firstNames = parts.join(' ')
  var query = '+givenname:"' + firstNames + '"~+surname:"' + lastName + '"~+birth_place:"' + display.birthPlace + '"~'
    , birthYear
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'
  }
  return 'https://familysearch.org/search/record/results#count=20&query=' + encodeURIComponent(query)
}

function familySearchAdv(person) {

}


var states = {
  'AK': 'Alaska',
  'AL': 'Alabama',
  'AR': 'Arkansas',
  'AS': 'American Samoa',
  'AZ': 'Arizona',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DC': 'District of Columbia',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'GU': 'Guam',
  'HI': 'Hawaii',
  'IA': 'Iowa',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'MA': 'Massachusetts',
  'MD': 'Maryland',
  'ME': 'Maine',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MO': 'Missouri',
  'MP': 'Northern Mariana Islands',
  'MS': 'Mississippi',
  'MT': 'Montana',
  'NA': 'National',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'NE': 'Nebraska',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NV': 'Nevada',
  'NY': 'New York',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'PR': 'Puerto Rico',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VA': 'Virginia',
  'VI': 'Virgin Islands',
  'VT': 'Vermont',
  'WA': 'Washington',
  'WI': 'Wisconsin',
  'WV': 'West Virginia',
  'WY': 'Wyoming'
}

function isUS(birth, death) {
  var us = /united states/i
    , r
  birth = birth || ''
  death = death || ''
  if (birth.match(us) || death.match(us)) return true
  for (var a in states) {
    r = new RegExp(states[a], 'i')
    if (birth.match(r) || death.match(r)) return true
  }
  return false
}

var census_years = {
  1900: 1325221,
  1910: 1727033,
  1920: 1488411,
  1930: 1810731,
  1940: 2000219,
  1880: 1417683,
  1870: 1438024,
  1860: 1473181,
  1850: 1401638,
  1840: 1786457,
  1830: 1803958,
  1820: 1803955,
  1810: 1803765,
  1800: 1804228,
  1790: 1803959
}

function search_collection(person, cid) {
  return familySearch(person) + '&collection_id=' + cid
}

function getCensuses(person) {
  var display = person.rels.display
    , censai = []
    , deathYear = getYear(display.deathDate)
    , birthYear = getYear(display.birthDate)
    , base = ''
  if (!isUS(display.birthPlace, display.deathPlace)) return []
  if (deathYear && !birthYear) {
    birthYear = deathYear - 70
  }
  if (birthYear && !deathYear) {
    deathYear = birthYear + 70
  }
  if (!birthYear) return []
  base = familySearch(person)
  for (var year in census_years) {
    if (birthYear - 5 < parseInt(year) && deathYear + 5 > parseInt(year)) {
      censai.push({
        href: base + '&collection_id=' + census_years[year],
        title: year + ' US Census'
      })
    }
  }
  return censai
}

function billionGraves(person) {
  var display = person.rels.display
    , parts = display.name.split(' ')
    , lastName = parts.pop()
    , firstNames = parts.join('+')
    , birthYear
    , deathYear
    , query = 'http://billiongraves.com/pages/search/#given_names=' + firstNames + '&family_names=' + lastName + '&year_range=5&lim=0&num=10&action=search'
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {
    query += '&birth_year=' + birthYear
  }
  if (display.deathDate && (deathYear = getYear(display.deathDate))) {
    query += '&death_year=' + deathYear
  }
  return query
}

function searchItems(person) {
  return [
    {
      href: familySearch(person),
      title: 'FamilySearch simple search'
    },
    /*{
      href: familySearchAdv(person),
      title: 'FamilySearch advanced search'
    },*/
    {
      href: billionGraves(person),
      title: 'Billion Graves search'
    }
  ].concat(getCensuses(person))
}