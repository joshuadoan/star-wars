import { useEffect, useState } from "react"
import { DataTable } from "./components/DataTable"
import "./App.css"


const SW_API = "https://swapi.dev/api/"

enum EntityType {
  Starships = "starships",
  People = "people",
}

type StarShip = {
  name: string,
  model: string,
  manufacturer: string,
  passengers: string,
}

type Film = {
  title: string,
  [EntityType.Starships]: string[] // array of urls
  [EntityType.People]: string[] // array of urls
}

type State = {
  films: Film[],
  ids: string[],
  entityType: EntityType,
  details: StarShip[],
  isLoading: boolean
}

/**
 * Create column definitions based on the entity type
 */
function createColDefs(entity: EntityType) {
  switch (entity) {
    case EntityType.Starships:
      return [
        {
          accessorKey: "name",
          header: "Name",
        },
        {
          accessorKey: "model",
          header: "Model",
        },
        {
          accessorKey: "manufacturer",
          header: "Manufacturer",
        },
        {
          accessorKey: "passengers",
          header: "Passengers",
        },
      ]
    case EntityType.People:
      return [
        {
          accessorKey: "name",
          header: "Name",
        },
        {
          accessorKey: "height",
          header: "Height",
        },
        {
          accessorKey: "mass",
          header: "Mass",
        }]
    default:
      return []
  }
}

function App() {
  const [state, setState] = useState<State>({
    films: [],
    ids: [],
    entityType: EntityType.Starships,
    details: [],
    isLoading: false
  })

  useEffect(function fetchFilms() {
    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true
    }))

    // Fetch films
    fetch(SW_API + "films").then(response => {
      if (!response.ok) {
        console.warn("error")
      }
      return response.json()
    })
      // Set films
      .then((data: {
        results: Film[]
      }) => {
        setState(prev => ({
          ...prev,
          films: data.results,
        }))
      })
      // Catch errors
      .catch(e => {
        console.warn("error", e.message)
      })
      // Finally, set loading state to false
      .finally(() => setState(prev => ({
        ...prev,
        isLoading: false,
      })))
  }, [])

  useEffect(function fetchDetails() {
    // If there are no ids, return
    if (!state.ids.length) {
      return;
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true
    }))

    // Fetch details
    Promise.all(state.ids.map(id => {
      return fetch(`${SW_API}/${state.entityType}/${id}`)
    }))
      .then(response => {
        return Promise.all(response.map(res => res.json()))
      })
      // Set details
      .then(data => {
        setState(prev => ({
          ...prev,
          details: data
        }))
      })
      // Set loading state to false
      .finally(() => {
        setState(prev => ({
          ...prev,
          isLoading: false
        }))
      })
  }, [state.entityType, state.ids])

  function handleFilmChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const film = state.films.find(f => f.title === e.currentTarget.value)
    if (!film || !state.entityType) {
      return;
    }

    const ids = film[state.entityType].map(url => url.split("/")[5]) ?? []
    setState(prev => ({
      ...prev,
      ids
    }))
  }

  function handleEntityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setState(prev => ({
      ...prev,
      entityType: e.target.value as EntityType,
    }))
  }

  return (
    <main className="text-left">
      <header className="flex gap-2">
        {/* Select a film */}
        <select
          defaultValue={state.films[0]?.title}
          className="select w-full max-w-xs"
          onChange={handleFilmChange}>
          <option selected disabled>
            Choose a film
          </option>
          {
            state.films.map(film => {
              return (
                <option
                  key={film.title}>{film.title}</option>
              )
            })
          }
        </select>

        {/* Select an entity to get details */}
        <select
          className="select w-full max-w-xs"
          value={state.entityType || undefined}
          onChange={handleEntityChange}>
          <option selected disabled>
            Choose an entity
          </option>
          <option
            value={EntityType.Starships}>
            {EntityType.Starships}
          </option>
          <option
            value={EntityType.People}>
            {EntityType.People}
          </option>
        </select>
      </header>
      {/* Display loading state */}
      {state.isLoading && <div className="w-full p-4 flex gap-4">Loading... <span className=" loading loading-ring loading-xs"></span></div>}

      {/* Display table */}
      <DataTable columns={createColDefs(state.entityType)} data={state.details} />
    </main>
  )
}

export default App
