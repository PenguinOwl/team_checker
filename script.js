"use strict";

//const PokeAPI = new Pokedex.Pokedex({ cacheImages: true })
const PokeAPI = new Pokedex.Pokedex()

function get_poke(id) {
  return document.getElementById("poke" + id)
}

function get_type_badge(type) {
  type = type[0].toUpperCase() + type.slice(1).toLowerCase()
  let image = document.createElement("img")
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
  let strong = document.createElement("strong")
  strong.appendChild(document.createTextNode(text))
  element.appendChild(strong)
  return strong
}

function add_big_text(element, text) {
  let strong = document.createElement("strong")
  strong.appendChild(document.createTextNode(text))
  element.appendChild(strong)
  strong.classList.add("bigtext")
  return strong
}

async function get_move_attacking_type(move_name) {
  let move = await PokeAPI.getMoveByName(move_name.toLowerCase().replace(/ /g,"-"))
  if (move.damage_class.name == "status") {
    return null
  }
  return move.type.name
}

async function get_moveset_coverage(moveset, stab = []) {
  let coverage = []
  for (let i = 0; i < moveset.length; i++) {
    let type = await get_move_attacking_type(moveset[i])
    if (type && !coverage.includes(type)) {
      coverage.push(type)
    }
  }
  return coverage.sort((a, b) => (stab.includes(b) ? 1 : 0) - (stab.includes(a) ? 1 : 0))
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

async function get_team_defense(team_data, dict, counter_dict) {
  let count = {}
  all_types.forEach((type) => {
    count[type] = []
  })
  for (let i = 0; i < team_data.length; i++) {
    let pokemon = team_data[i]
    let types = pokemon.types.map((e) => e.type.name)
    let enemy_types = []
    if (types.length == 2) {
      let merged_counter_list = counter_dict[types[0]].concat(counter_dict[types[1]])
      enemy_types = dict[types[0]].concat(dict[types[1]]).filter(onlyUnique).filter((e) => !merged_counter_list.includes(e))
    } else {
      enemy_types = dict[types[0]].filter((e) => !counter_dict[types[0]].includes(e))
    }
    enemy_types.forEach((type) => {
      count[type].push(i)
    })
  }
  return count
}

async function get_team_offense(team_set, dict) {
  let count = {}
  all_types.forEach((type) => {
    count[type] = []
  })
  for (let i = 0; i < team_set.length; i++) {
    let types = await get_moveset_coverage(team_set[i].moves)
    let enemy_types = []
    types.forEach((type) => {
      enemy_types = enemy_types.concat(dict[type])
    })
    enemy_types.forEach((type) => {
      if (!count[type].includes(i)) {
        count[type].push(i)
      }
    })
  }
  return count
}

async function generate_coverage_graph(map, ascending = true, title = "default") {
  let wrapper = document.createElement("div")
  add_big_text(wrapper, title)
  add_br(wrapper)
  let list = []
  all_types.forEach((type) => {
    list.push({name: type, count: map[type]})
  })
  list.sort((a, b) => (b.count.length - a.count.length) * (ascending ? 1 : -1))
  list.forEach((element) => {
    add_br(wrapper)
    let div = document.createElement("div")
    div.appendChild(get_type_badge(element.name))
    add_br(div)
    element.count.forEach((pokemon_id) => {
      div.appendChild(get_pokemon_image(team_data[pokemon_id], true))
    })
    div.classList.add("type-block")
    wrapper.appendChild(div)
  })
  return wrapper.outerHTML
}

function add_e(outer, inner) {
  outer.appendChild(inner)
}

async function generate_matchup_table() {
  let wrapper = document.createElement("div")
  wrapper.style.margin = "auto"
  wrapper.style.display = "inline-block"
  add_big_text(wrapper, "Matchup Grid")
  add_br(wrapper)
  add_br(wrapper)
  let table = document.createElement("table")
  add_e(wrapper, table)
  let head = document.createElement("thead")
  add_e(table, head)
  let header_row = document.createElement("tr")
  add_e(head, header_row)
  let matchup_coverage_table = []
  for (let i = 0; i < team.length; i++) {
    let part = document.createElement("th")
    add_e(header_row, part)
    add_e(part, get_pokemon_image(team_data[i], false))
    matchup_coverage_table[i] = await get_moveset_coverage(team[i].moves, team_data[i].types.map((e) => e.type.name))
  }
  add_e(header_row, document.createElement("th"))
  let tbody = document.createElement("tbody")
  add_e(table, tbody)
  let enemy_team = document.getElementById("poke-input2").value.split("/").map((e) => e.trim())
  for (let i = 0; i < enemy_team.length; i++) {
    enemy_team[i] = await get_pokemon(enemy_team[i])
  }
  enemy_team.forEach((enemy) => {
    let row = document.createElement("tr")
    add_e(tbody, row)
    let label = document.createElement("td")
    let badge = get_pokemon_image(enemy, false)
    add_e(label, badge)
    label.style["vertical-align"] = "middle"
    badge.style["margin-left"] = "4px"
    badge.style["height"] = "85px"
    badge.style["width"] = "85px"
    for (let i = 0; i < team.length; i++) {
      let coloring = document.createElement("td")
      coloring.classList.add("bordered")
      add_e(row, coloring)
      coloring.style.height = "50px"
      coloring.style.width = "80px"
      let effectiveness_array = matchup_coverage_table[i].map((e) => get_effectiveness(e, enemy.types.map((e) => e.type.name)))
      let effectiveness = effectiveness_array.reduce((a, b) => Math.max(a, b), -Infinity);
      let text;
      switch(effectiveness) {
        case 4:
          coloring.style["background-color"] = "#f3f3ee"
          text = add_bold_text(coloring, "1")
          text.style["color"] = "gray"
          text.style["vertical-align"] = "-webkit-baseline-middle"
          break;
        case 16:
          coloring.style["background-color"] = "#009900"
          text = add_bold_text(coloring, "4")
          text.style["color"] = "white"
          text.style["vertical-align"] = "-webkit-baseline-middle"
          break;
        case 8:
          coloring.style["background-color"] = "#29d946"
          text = add_bold_text(coloring, "2")
          text.style["color"] = "white"
          text.style["vertical-align"] = "-webkit-baseline-middle"
          break;
        case 2:
          coloring.style["background-color"] = "#ff5050"
          text = add_bold_text(coloring, "½")
          text.style["color"] = "white"
          text.style["vertical-align"] = "-webkit-baseline-middle"
          break;
        case 1:
          coloring.style["background-color"] = "#b00000"
          text = add_bold_text(coloring, "¼")
          text.style["color"] = "white"
          text.style["vertical-align"] = "-webkit-baseline-middle"
          break;
        case 0:
          coloring.style["background-color"] = "#330033"
          text = add_bold_text(coloring, "∅")
          text.style["color"] = "white"
          text.style["vertical-align"] = "-webkit-baseline-middle"
          break;
      }
      add_br(coloring)
      add_e(coloring, get_type_badge(matchup_coverage_table[i][effectiveness_array.indexOf(effectiveness)]))
    }
    add_e(row, label)
  })
  return wrapper.outerHTML
}

async function generate_defense_table() {
  let wrapper = document.createElement("div")
  let table = document.createElement("table")
  let head = document.createElement("thead")
  let header_row = document.createElement("tr")
  wrapper.style.float = "right"
  add_big_text(wrapper, "Defensive Matrix")
  add_br(wrapper)
  add_br(wrapper)
  add_e(wrapper, table)
  add_e(table, head)
  add_e(head, header_row)
  add_e(header_row, document.createElement("th"))
  for (let i = 0; i < team.length; i++) {
    let part = document.createElement("th")
    add_e(header_row, part)
    add_e(part, get_pokemon_image(team_data[i], false))
  }
  let tbody = document.createElement("tbody")
  add_e(table, tbody)
  all_types.forEach((type) => {
    let row = document.createElement("tr")
    add_e(tbody, row)
    let label = document.createElement("td")
    add_e(row, label)
    let badge = get_type_badge(type)
    add_e(label, badge)
    label.style["vertical-align"] = "middle"
    badge.style["margin-right"] = "8px"
    for (let i = 0; i < team.length; i++) {
      let coloring = document.createElement("td")
      coloring.classList.add("bordered")
      add_e(row, coloring)
      coloring.style.height = "40px"
      coloring.style.width = "40px"
      let effectivness = get_effectiveness(type, team_data[i].types.map((e) => e.type.name))
      switch(effectivness) {
        case 4:
          coloring.style["background-color"] = "#f3f3ee"
          add_bold_text(coloring, "1").style["color"] = "gray"
          break;
        case 16:
          coloring.style["background-color"] = "#b00000"
          add_bold_text(coloring, "4").style["color"] = "white"
          break;
        case 8:
          coloring.style["background-color"] = "#ff5050"
          add_bold_text(coloring, "2").style["color"] = "white"
          break;
        case 2:
          coloring.style["background-color"] = "#29d946"
          add_bold_text(coloring, "½").style["color"] = "white"
          break;
        case 1:
          coloring.style["background-color"] = "#009900"
          add_bold_text(coloring, "¼").style["color"] = "white"
          break;
        case 0:
          coloring.style["background-color"] = "#330033"
          add_bold_text(coloring, "∅").style["color"] = "white"
          break;
      }
    }
  })
  return wrapper.outerHTML
}

async function generate_offense_table() {
  let wrapper = document.createElement("div")
  add_big_text(wrapper, "Offensive Matrix")
  add_br(wrapper)
  add_br(wrapper)
  let table = document.createElement("table")
  add_e(wrapper, table)
  let head = document.createElement("thead")
  add_e(table, head)
  let header_row = document.createElement("tr")
  add_e(head, header_row)
  let coverage_table = []
  for (let i = 0; i < team.length; i++) {
    let part = document.createElement("th")
    add_e(header_row, part)
    add_e(part, get_pokemon_image(team_data[i], false))
    coverage_table[i] = await get_moveset_coverage(team[i].moves)
  }
  add_e(header_row, document.createElement("th"))
  let tbody = document.createElement("tbody")
  add_e(table, tbody)
  all_types.forEach((type) => {
    let row = document.createElement("tr")
    add_e(tbody, row)
    for (let i = 0; i < team.length; i++) {
      let coloring = document.createElement("td")
      coloring.classList.add("bordered")
      add_e(row, coloring)
      coloring.style.height = "40px"
      coloring.style.width = "40px"
      let effectiveness_array = coverage_table[i].map((e) => get_effectiveness(e, [type]))
      let effectiveness = effectiveness_array.reduce((a, b) => Math.max(a, b), -Infinity);
      switch(effectiveness) {
        case 4:
          coloring.style["background-color"] = "#f3f3ee"
          add_bold_text(coloring, "1").style["color"] = "gray"
          break;
        case 16:
          coloring.style["background-color"] = "#009900"
          add_bold_text(coloring, "4").style["color"] = "white"
          break;
        case 8:
          coloring.style["background-color"] = "#009900"
          add_bold_text(coloring, "2").style["color"] = "white"
          break;
        case 2:
          coloring.style["background-color"] = "#ff5050"
          add_bold_text(coloring, "½").style["color"] = "white"
          break;
        case 1:
          coloring.style["background-color"] = "#ff1a1a"
          add_bold_text(coloring, "¼").style["color"] = "white"
          break;
        case 0:
          coloring.style["background-color"] = "#330033"
          add_bold_text(coloring, "∅").style["color"] = "white"
          break;
      }
    }
    let label = document.createElement("td")
    add_e(row, label)
    let badge = get_type_badge(type)
    add_e(label, badge)
    label.style["vertical-align"] = "middle"
    badge.style["margin-left"] = "8px"
  })
  return wrapper.outerHTML
}

function get_effectiveness(offensive_type, defensive_types) {
  let effectiveness = 4
  defensive_types.forEach((defensive_type) => {
    if (offensive_immune[offensive_type].includes(defensive_type))
      effectiveness *= 0
    if (offensive_strong[offensive_type].includes(defensive_type))
      effectiveness *= 2
    if (offensive_weak[offensive_type].includes(defensive_type))
      effectiveness /= 2
  })
  return effectiveness
}

function get_pokemon_image(pokemon_data, small = false) {
  let image = document.createElement("img")
  if (pokemon_data) {
    image.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + pokemon_data.id + ".png"
    image.alt = pokemon_data.name + " sprite"
    image.title = pokemon_data.name.toUpperCase()
  } else {
    image.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png"
    image.alt = "unknown sprite"
    image.title = "UNKNOWN"
  }
  if (small) {
    image.style.height = "70px"
    image.style.width = "70px"
  }
  return image
}


async function generate_pokedata(pokemon, pokemon_data) {
  let div = document.createElement("div")
  let namebox = document.createElement("div")
  let movebox = document.createElement("div")
  movebox.style = "line-height: 0; vertical-align: 0"
  namebox.style.height = "20px"
  let image = get_pokemon_image(pokemon_data)
  div.appendChild(image)
  add_br(div)
  if (!pokemon_data) {
    return
  }
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
  let coverage = await get_moveset_coverage(pokemon.moves)
  coverage.forEach((type) => {
    movebox.appendChild(get_type_badge(type))
  })
  div.appendChild(movebox)
  return div.outerHTML
}

var all_types = []
var offensive_coverage = {}
var offensive_blinds = {}
var defensive_coverage = {}
var defensive_blinds = {}
var offensive_strong = {}
var offensive_weak = {}
var offensive_immune = {}
var defensive_weak = {}
var defensive_resist = {}
var defensive_immune = {}

function add_types(type_dict, base_type, type_list) {
  let types = type_list.map((e) => e.name)
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
  let results = await PokeAPI.getTypesList()
  for (let i = 0; i < 18; i++) {
    let base_type = results.results[i].name
    all_types.push(base_type)
  }
  initialize_type_dict(offensive_coverage)
  initialize_type_dict(offensive_blinds)
  initialize_type_dict(defensive_coverage)
  initialize_type_dict(defensive_blinds)

  initialize_type_dict(offensive_strong)
  initialize_type_dict(offensive_weak)
  initialize_type_dict(offensive_immune)
  initialize_type_dict(defensive_resist)
  initialize_type_dict(defensive_weak)
  initialize_type_dict(defensive_immune)
  for (let i = 0; i < 18; i++) {
    let base_type = results.results[i].name
    let all_type_data = await PokeAPI.getTypeByName(base_type)
    let type_data = all_type_data.damage_relations
    add_types(offensive_coverage, base_type, type_data.double_damage_to)
    add_types(offensive_blinds, base_type, type_data.half_damage_to)
    add_types(offensive_blinds, base_type, type_data.no_damage_to)
    add_types(defensive_coverage, base_type, type_data.half_damage_from)
    add_types(defensive_coverage, base_type, type_data.no_damage_from)
    add_types(defensive_blinds, base_type, type_data.double_damage_from)

    add_types(offensive_strong, base_type, type_data.double_damage_to)
    add_types(offensive_weak, base_type, type_data.half_damage_to)
    add_types(offensive_immune, base_type, type_data.no_damage_to)
    add_types(defensive_resist, base_type, type_data.half_damage_from)
    add_types(defensive_weak, base_type, type_data.double_damage_from)
    add_types(defensive_immune, base_type, type_data.no_damage_from)
  }
}

var team
var team_data
const incarnates = ["tornadus", "thundurus", "landorus"]

async function get_pokemon(pokemon_name) {
  pokemon_name = pokemon_name
    .toLowerCase()
    .replace(/ /g,"-")
    .replace(/\./g,"")
    .replace("-*", "")
  if (incarnates.includes(pokemon_name)) {
    pokemon_name = pokemon_name + "-incarnate"
  }
  switch(pokemon_name) {
    case "urshifu":
      pokemon_name = "urshifu-single-strike"
      break
    case "urshifu-gmax":
      pokemon_name = "urshifu-single-strike-gmax"
      break
    case "darmanitan":
      pokemon_name = "darmanitan-standard"
      break
    case "darmanitan-galar":
      pokemon_name = "darmanitan-galar-standard"
      break
    case "indeedee-f":
      pokemon_name = "indeedee-female"
      break
    case "indeedee-m":
    case "indeedee":
      pokemon_name = "indeedee-male"
      break
    case "necrozma-dusk-mane":
      pokemon_name = "necrozma-dusk"
      break
    case "necrozma-dawn-wings":
      pokemon_name = "necrozma-dawn"
      break
  }
  return await PokeAPI.getPokemonByName(pokemon_name)
}

async function render() {
  await new Promise(r => setTimeout(r, 50));
  var text_input = document.getElementById("poke-input")
  team = Koffing.parse(text_input.value).teams[0].pokemon
  team_data = []
  for (let i = 0; i < team.length; i++) {
    let pokemon = team[i]
    team_data[i] = await get_pokemon(pokemon.name)
    get_poke(i+1).innerHTML = await generate_pokedata(pokemon, team_data[i])
  }
  for (let i = team.length; i < 6; i++) {
    team_data[i] = null
    get_poke(i+1).innerHTML = ""
  }
  document.getElementById("offensive-coverage").innerHTML = await generate_coverage_graph(await get_team_offense(team, offensive_coverage), false, "Offensive Coverage")
  document.getElementById("defensive-coverage").innerHTML = await generate_coverage_graph(await get_team_defense(team_data, defensive_coverage, defensive_blinds), false, "Defensive Coverage")
  document.getElementById("defensive-blindspots").innerHTML = await generate_coverage_graph(await get_team_defense(team_data, defensive_blinds, defensive_coverage), true, "Defensive Blind Spots")
  document.getElementById("defense-table").innerHTML = await generate_defense_table()
  document.getElementById("offense-table").innerHTML = await generate_offense_table()
  if (document.getElementById("poke-input2").value != "") {
    render_matchup()
  }
}

async function render_matchup() {
  await new Promise(r => setTimeout(r, 50));
  var text_input2 = document.getElementById("poke-input2")
  document.getElementById("matchup-table").innerHTML = await generate_matchup_table()
}

window.onload = () => {
  var text_input = document.getElementById("poke-input")
  var text_input2 = document.getElementById("poke-input2")
  text_input.onchange = render
  text_input.onpaste = render
  text_input2.onchange = render_matchup
  text_input2.onpaste = render_matchup
  generate_type_tables()
}
