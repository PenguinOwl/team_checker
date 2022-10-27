//const PokeAPI = new Pokedex.Pokedex({ cacheImages: true })
const PokeAPI = new Pokedex.Pokedex()

function get_poke(id) {
  return document.getElementById("poke" + id)
}

function get_type_badge(type) {
  type = type[0].toUpperCase() + type.slice(1).toLowerCase()
  image = document.createElement("img")
  image.src = "https://play.pokemonshowdown.com/sprites/types/" + type + ".png"
  image.style = "image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; width: 64px; margin-top: -2px; margin-bottom: -2px"
  image.alt = type
  return image
}

function add_br(element) {
  element.appendChild(document.createElement("br"))
}

function add_text(element, text) {
  element.appendChild(document.createTextNode(text))
}

function add_bold_text(element, text) {
  strong = document.createElement("strong")
  strong.appendChild(document.createTextNode(text))
  element.appendChild(strong)
}

async function get_move_attacking_type(move_name) {
  move = await PokeAPI.getMoveByName(move_name.toLowerCase().replace(/ /g,"-"))
  if (move.damage_class.name == "status") {
    return null
  }
  return move.type.name
}

async function get_moveset_coverage(moveset) {
  var coverage = []
  for (i = 0; i < moveset.length; i++) {
    type = await get_move_attacking_type(moveset[i])
    if (type && !coverage.includes(type)) {
      coverage.push(type)
    }
  }
  return coverage
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

async function get_team_defense(team_data, dict, counter_dict) {
  count = {}
  all_types.forEach((type) => {
    count[type] = 0
  })
  team_data.forEach((pokemon) => {
    types = pokemon.types.map((e) => e.type.name)
    enemy_types = []
    if (types.length == 2) {
      console.log(dict[types[0]].concat(dict[types[1]]))
      merged_counter_list = counter_dict[types[0]].concat(counter_dict[types[1]])
      enemy_types = dict[types[0]].concat(dict[types[1]]).filter(onlyUnique).filter((e) => !merged_counter_list.includes(e))
    } else {
      enemy_types = dict[types[0]].filter((e) => !counter_dict[types[0]].includes(e))
    }
    enemy_types.forEach((type) => {
      if (!count[type]) {
        count[type] = 0
      }
      count[type] += 1
    })
  })
  return count
}

async function get_team_offense(team_set, dict) {
  count = {}
  all_types.forEach((type) => {
    count[type] = 0
  })
  await team_set.forEach(async (pokemon) => {
    types = await get_moveset_coverage(pokemon.moves)
    enemy_types = []
    types.forEach((type) => {
      enemy_types = enemy_types.concat(dict[types])
    })
    enemy_types.forEach((type) => {
      count[type] += 1
    })
  })
  return count
}

async function generate_coverage_graph(map, ascending) {
  list = []
  all_types.forEach((type) => {
    list.push({name: type, count: map[type]})
  })
}

async function generate_pokedata(pokemon, pokemon_data) {
  div = document.createElement("div")
  namebox = document.createElement("div")
  movebox = document.createElement("div")
  movebox.style = "line-height: 0; vertical-align: 0"
  namebox.style.height = "20px"
  image = document.createElement("img")
  image.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + pokemon_data.id + ".png"
  image.alt = pokemon_data.name + " Sprite"
  div.appendChild(image)
  add_br(div)
  add_bold_text(namebox, pokemon_data.name.toUpperCase())
  div.appendChild(namebox)
  add_br(div)
  add_br(div)
  add_text(div, "Defensive Typing")
  add_br(div)
  pokemon_data.types.forEach((type) => {
    div.appendChild(get_type_badge(type.type.name))
  })
  add_br(div)
  add_text(div, "Offensive Typing")
  add_br(div)
  coverage = await get_moveset_coverage(pokemon.moves)
  coverage.forEach((type) => {
    movebox.appendChild(get_type_badge(type))
  })
  div.appendChild(movebox)
  return div.outerHTML
}

all_types = []
offensive_coverage = {}
offensive_blinds = {}
defensive_coverage = {}
defensive_blinds = {}

function add_types(type_dict, base_type, type_list) {
  types = type_list.map((e) => e.name)
  types.forEach((type) => {
    type_dict[base_type].push(type)
  })
}

function initialize_type_dict(type_dict) {
  all_types.forEach((type) => {
    type_dict[type] = []
  })
}

async function generate_type_tables() {
  results = await PokeAPI.getTypesList()
  for (i = 0; i < 18; i++) {
    base_type = results.results[i].name
    all_types.push(base_type)
  }
  initialize_type_dict(offensive_coverage)
  initialize_type_dict(offensive_blinds)
  initialize_type_dict(defensive_coverage)
  initialize_type_dict(defensive_blinds)
  for (i = 0; i < 18; i++) {
    base_type = results.results[i].name
    all_type_data = await PokeAPI.getTypeByName(base_type)
    type_data = all_type_data.damage_relations
    add_types(offensive_coverage, base_type, type_data.double_damage_to)
    add_types(offensive_blinds, base_type, type_data.half_damage_to)
    add_types(offensive_blinds, base_type, type_data.no_damage_to)
    add_types(defensive_coverage, base_type, type_data.half_damage_from)
    add_types(defensive_coverage, base_type, type_data.no_damage_from)
    add_types(defensive_blinds, base_type, type_data.double_damage_from)
  }
}

var team
var team_data
const incarnates = ["tornadus", "thundurus", "landorus"]

window.onload = () => {
  var text_input = document.getElementById("poke-input")
  text_input.onchange = async () => {
    team = Koffing.parse(text_input.value).teams[0].pokemon
    team_data = []
    for (var i = 0; i < team.length; i++) {
      pokemon = team[i]
      pokemon_name = pokemon.name.toLowerCase()
      if (incarnates.includes(pokemon_name)) {
        pokemon_name = pokemon_name + "-incarnate"
      }
      team_data[i] = await PokeAPI.getPokemonByName(pokemon_name)
      get_poke(i+1).innerHTML = await generate_pokedata(pokemon, team_data[i])
    }
    for (var i = team.length; i < 6; i++) {
      team_data[i] = null
      get_poke(i+1).innerHTML = ""
    }
  }
  generate_type_tables()
}
