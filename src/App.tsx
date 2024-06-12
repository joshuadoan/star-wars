import { useEffect, useState } from "react"
import { DataTable } from "./components/DataTable"
import "./App.css"
import { useQuery } from "@tanstack/react-query"


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
  ids: string[],
  entityType: EntityType,
  details: StarShip[],
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
    ids: [],
    entityType: EntityType.Starships,
    details: [],
  })

  const films = useFetchFilms();

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
    const film = films?.data?.find(f => f.title === e.currentTarget.value)
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
    <main className="text-left bg-gray-200 p-4 h-screen">
      <header className="flex gap-2  p-2 rounded-md mb-4">
        {/* Select a film */}
        <select
          defaultValue={films.data?.[0]?.title ?? ""}
          className="select w-full max-w-xs"
          onChange={handleFilmChange}>
          <option selected disabled>
            Choose a film
          </option>
          {
            films.data?.map(film => {
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
        {films.isLoading && <span className="loading loading-ring loading-x text-secondary"></span>}

      </header>

      {/* Display table */}
      <DataTable columns={createColDefs(state.entityType)} data={state.details} className=" bg-white rounded-lg" />
    </main>
  )
}

export default App


const QUERY_KEY = ['Films'];

const fetchFilms = async (): Promise<Film[]> => {
  const response = await fetch(SW_API + "films");
  const data = await response.json();
  return data.results;
};

export const useFetchFilms = () => {
  return useQuery<Film[], Error>({
    queryKey: QUERY_KEY,
    queryFn: () => fetchFilms(),
  });
};