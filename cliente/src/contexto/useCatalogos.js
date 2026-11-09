import { createContext, useContext } from "react"

export const ContextoCatalogos = createContext({ competencias: [], categorias: [] })
export const useCatalogos = () => useContext(ContextoCatalogos)
