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
    console.log(coverage)
    movebox.appendChild(get_type_badge(type))
  })
  div.appendChild(movebox)
  return div.outerHTML
}

var team_data

window.onload = () => {
  var text_input = document.getElementById("poke-input")
  text_input.onchange = async () => {
    team = Koffing.parse(text_input.value).teams[0].pokemon
    team_data = []
    for (var i = 0; i < team.length; i++) {
      pokemon = team[i]
      team_data[i] = await PokeAPI.getPokemonByName(pokemon.name.toLowerCase())
      get_poke(i+1).innerHTML = await generate_pokedata(pokemon, team_data[i])
    }
    for (var i = team.length; i < 6; i++) {
      team_data[i] = null
      get_poke(i+1).innerHTML = ""
    }
  }
}
