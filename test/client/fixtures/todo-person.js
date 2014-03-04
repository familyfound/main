
var x = require('xon')

var displays = [
  {
    gender: 'Female',
    generation: 3,
    lifespan: '1809-1867',
    name: 'Jemaima Forsyth'
  },
  {
    gender: 'Male',
    generation: 2,
    lifespan: '1809-1867',
    name: 'Jared Forsyth'
  },
  {
    gender: 'Female',
    generation: 1,
    lifespan: '1909-1927',
    name: 'Josephine Forsyth'
  }
]

var todos = [{
  completed: false,
  created: "2014-02-25T04:21:31.563Z",
  data: {
    args: 'K24X-3GW "Jakob Messerli"',
    links: {
      'resolve': "https://familysearch.org/tree/#view=merge&person=KWJK-27L&otherPerson=K24X-3GW"
    },
  },
  hard: false,
  key: "K24X-3GW",
  retired: false,
  type: "resolve duplicates",
}, {
  completed: false,
  created: "2014-02-25T04:21:31.563Z",
  data: {
    args: "date and place",
    links: {
      'search records':  'https://familysearch.org/search/things'
    }
  },
  hard: false,
  retired: false,
  type: "find death info",
}, {
  completed: false,
  created: "2014-02-25T04:21:31.563Z",
  data: 1,
  hard: false,
  retired: false,
  type: "find name",
}, {
  completed: false,
  created: "2014-02-25T04:21:31.563Z",
  data: 2,
  hard: false,
  retired: false,
  type: "find children",
}]


module.exports = [
  {
    display: displays[0],
    id: 'KWZH-LM2',
    lineage: [displays[1], displays[2]],
    modified: new Date(),
    starred: false,
    todos: todos,
    customTodos: [{
      title: 'Ask grandma about her things',
      note: "Possible source: https://familysearch.org/pal:/MM9.1.1/M8P5-MML, But there's also this person KWHZ-3D1 or this other one https://familysearch.org/tree/#view=ancestor&person=KWHZ-3D1",
      completed: false,
      hard: false
    }],
    user: 'USSR-FXW'
  }
].map(function (data) {
  return {
    initialData: {data: data},
    showAnyway: true
  }
})

