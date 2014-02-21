
module.exports = {
  calculate: calculate,
  text: relationshipText
}

function relationshipText(gender, lineage_len) {
  var rel = calculate(gender, lineage_len)
  if (lineage_len) rel = 'Your ' + rel
  return rel
}

function nth(num) {
  if (num > 3 && num < 21) return 'th'
  return ['th', 'st', 'nd', 'rd'][num % 10]
}

function calculate(gender, lineage_len) {
  var names = {
    0: {
      Male: "It's You!",
      Female: "It's You!"
    },
    1: {
      Male: 'Father',
      Female: 'Mother'
    },
    2: {
      Male: 'Grandfather',
      Female: 'Grandmother'
    },
    3: {
      Male: 'Great-Grandfather',
      Female: 'Great-Grandmother'
    }
  }
  if (lineage_len < 4) {
    return names[lineage_len][gender]
  }
  var num = lineage_len - 2
  return num + nth(num) + ' ' + names[3][gender]
}

