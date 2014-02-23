
var todos = require('api').todos

function todosLeft(data) {
  if (data.completed) return 0
  if (!data.todos.length) return 0
  var left = 0
    , hard = 0
    , justCleanup = true
  for (var i=0; i<data.todos.length; i++) {
    if (data.todos[i].completed) continue;
    if (data.todos[i].hard) hard++;
    else left++;
    if (!todos.types[data.todos[i].type].cleanup) {
      justCleanup = false
    }
  }
  if (!left && !hard) return 0
  return {
    left: left,
    justCleanup: justCleanup,
    hard: hard
  }
}

var placeLists = {
  'o-us': [
    'United States',
    'Alaska',
    'Alabama',
    'Arkansas',
    'American Samoa',
    'Arizona',
    'California',
    'Colorado',
    'Connecticut',
    'District of Columbia',
    'Delaware',
    'Florida',
    'Georgia',
    'Guam',
    'Hawaii',
    'Iowa',
    'Idaho',
    'Illinois',
    'Indiana',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Massachusetts',
    'Maryland',
    'Maine',
    'Michigan',
    'Minnesota',
    'Missouri',
    'Northern Mariana Islands',
    'Mississippi',
    'Montana',
    'National',
    'North Carolina',
    'North Dakota',
    'Nebraska',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'Nevada',
    'New York',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Puerto Rico',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Virginia',
    'Virgin Islands',
    'Vermont',
    'Washington',
    'Wisconsin',
    'West Virginia',
    'Wyoming'
  ],
  'o-gb': [
    'Britain',
    'Ireland',
    'Scotland',
    'England'
  ],
  'o-eu': [
    'Albania',
    'Andorra',
    'Armenia',
    'Austria',
    'Azerbaijan',
    'Belarus',
    'Belgium',
    'Bosnia',
    'Herzegovina',
    'Bulgaria',
    'Croatia',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'Estonia',
    'Finland',
    'France',
    'Georgia',
    'Germany',
    'Greece',
    'Hungary',
    'Iceland',
    'Ireland',
    'Italy',
    'Kosovo',
    'Latvia',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Macedonia',
    'Malta',
    'Moldova',
    'Monaco',
    'Montenegro',
    'The Netherlands',
    'Norway',
    'Poland',
    'Portugal',
    'Romania',
    'Russia',
    'San Marino',
    'Serbia',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Sweden',
    'Switzerland',
    'Turkey',
    'Ukraine',
    'United Kingdom',
    'Vatican',
  ]
}

function originClass(place) {
  place = place.toLowerCase()
  for (var cls in placeLists) {
    for (var i in placeLists[cls]) {
      if (place.indexOf(placeLists[cls][i].toLowerCase()) !== -1) return cls
    }
  }
  return 'o-other'
}

module.exports = {
  tests: {
    completion: function (data) {
      if (!data.data || !data.data.todos) {
        return 'c-not-evaluated'
      }
      var todos = todosLeft(data.data)
      if (!todos) {
        return 'c-completed'
      }
      if (!todos.left) {
        return 'c-just-hard'
      }
      if (todos.justCleanup) {
        return 'c-just-cleanup'
      }
      return 'c-has-todos'
    },
    children: function (data) {
      if (data.rels.display.lifespan.match(/Living/)) return 'ch-living'
      var l = data.rels.children.length
      for (var i=1; i<5; i++) {
        if (i*3 > l) return 'ch-' + (i*3)
      }
      return 'ch-lots'
    },
    age: function (data) {
      var display = data.rels.display
      if (display.lifespan.match(/Living/)) return 'a-living'
      if (!display.age) return 'a-unknown'
      if (display.age < 30) return 'a-young'
      if (display.age < 60) return 'a-middle'
      if (display.age < 80) return 'a-old'
      return 'a-ancient'
    },
    sources: function (data) {
      if (data.rels.display.lifespan.match(/Living/)) return 's-living'
      if (!data.more || !data.more.sources) return 's-unknown'
      var n = data.more.sources.length
      if (!n) return 's-none'
      if (n < 3) return 's-few'
      if (n < 6) return 's-some'
      return 's-many'
    },
    modified: function (data) {
      var date = data.data.modified
      if (!date) return 'm-never'
      var diff = new Date().getTime() - new Date(date).getTime()
      if (diff < 24 * 60 * 60 * 1000) {
        return 'm-day'
      }
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return 'm-week'
      }
      if (diff < 31 * 7 * 24 * 60 * 60 * 1000) {
        return 'm-month'
      }
      return 'm-long'
    },
    origin: function (data) {
      var place = data.rels.display.birthPlace || data.rels.display.deathPlace
      if (!place) return 'o-unknown'
      return originClass(place)
    },
  },
  options: {
    completion: {
      'c-not-evaluated': 'Not Evaluated',
      'c-completed': 'Completed',
      'c-just-hard': 'Just Hard',
      'c-just-cleanup': 'Cleanup',
      'c-has-todos': 'Research'
    },
    children: {
      'ch-living': 'Living',
      'ch-3': '<3',
      'ch-6': '<6',
      'ch-9': '<9',
      'ch-12': '<12',
      'ch-lots': 'Lots'
    },
    age: {
      'a-living': 'Living',
      'a-young': '0-29',
      'a-middle': '30-59',
      'a-old': '60-79',
      'a-ancient': '80+',
      'a-unknown': 'Unknown',
    },
    sources: {
      's-living': 'Living',
      's-none': 'None',
      's-few': '< 3',
      's-some': '< 6',
      's-many': '6 +',
      's-unknown': 'Not Evaluated',
    },
    modified: {
      'm-day': 'Today',
      'm-week': 'This week',
      'm-month': 'Less than a month',
      'm-long': 'More than a month',
      'm-never': 'Never'
    },
    origin: {
      'o-us': 'United States',
      // 'o-sa': 'South America',
      'o-gb': 'British Isles',
      'o-eu': 'Europe',
      'o-other': 'Other',
      'o-unknown': 'Unknown'
    }
  }
}


