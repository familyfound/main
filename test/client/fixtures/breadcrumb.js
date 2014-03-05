
var people = [
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
people = people.concat(people).concat(people).concat(people).concat(people);

module.exports = [
  {},
  {
    initialData: {data: {lineage: people}},
  }
]

