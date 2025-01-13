import { Input } from "@/components/ui/input"
import { useAxios } from "@/hooks/use-axios"
import { useLocation } from "wouter"
import React, { useEffect, useRef, useState } from "react"
import { useQuery } from "react-query"
import { Alert } from "./ui/alert"
import { useSnippetsBaseApiUrl } from "@/hooks/use-snippets-base-api-url"
import { PrefetchPageLink } from "./PrefetchPageLink"

interface SearchComponentProps {
  onResultsFetched?: (results: any[]) => void // optional
}

const LinkWithNewTabHandling = ({
  shouldOpenInNewTab,
  href,
  className,
  children,
}: {
  shouldOpenInNewTab: boolean
  href: string
  className?: string
  children: React.ReactNode
}) => {
  if (shouldOpenInNewTab) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    )
  }
  return (
    <PrefetchPageLink className={className} href={href}>
      {children}
    </PrefetchPageLink>
  )
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onResultsFetched,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const axios = useAxios()
  const resultsRef = useRef<HTMLDivElement>(null)
  const [location] = useLocation()
  const { snippetsBaseApiUrl } = useSnippetsBaseApiUrl()

  const { data: searchResults, isLoading } = useQuery(
    ["snippetSearch", searchQuery],
    async () => {
      if (!searchQuery) return []
      const { data } = await axios.get("/snippets/search", {
        params: { q: searchQuery },
      })
      if (onResultsFetched) {
        onResultsFetched(data.snippets)
      }
      return data.snippets
    },
    { enabled: Boolean(searchQuery) },
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowResults(!!searchQuery)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const shouldOpenInNewTab = location === "/editor" || location === "/ai"
  const shouldOpenInEditor = location === "/editor" || location === "/ai"

  return (
    <form onSubmit={handleSearch} className="relative">
      <Input
        type="search"
        placeholder="Search"
        className="pl-4 focus:border-blue-500 placeholder-gray-400 text-sm"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setShowResults(!!e.target.value)
        }}
        aria-label="Search snippets"
        role="searchbox"
      />
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-lg rounded-md z-10 p-2 flex items-center justify-center space-x-2">
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}

      {showResults && searchResults && (
        <div
          ref={resultsRef}
          className="absolute top-full md:left-0 right-0 mt-2 bg-white shadow-lg rounded-md z-10 w-80 max-h-screen overflow-y-auto overflow-x-visible"
        >
          {searchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((snippet: any) => (
                <li key={snippet.snippet_id} className="p-2 hover:bg-gray-50">
                  <LinkWithNewTabHandling
                    href={
                      shouldOpenInEditor
                        ? `/editor?snippet_id=${snippet.snippet_id}`
                        : `/${snippet.owner_name}/${snippet.unscoped_name}`
                    }
                    shouldOpenInNewTab={shouldOpenInNewTab}
                    className="flex"
                  >
                    <div className="w-12 h-12 overflow-hidden mr-2 flex-shrink-0 rounded-sm">
                      <img
                        src={`${useSnippetsBaseApiUrl()}/snippets/images/${snippet.owner_name}/${snippet.unscoped_name}/pcb.svg`}
                        alt={`PCB preview for ${snippet.name}`}
                        className="w-12 h-12 object-contain p-1 scale-[4] rotate-45"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-blue-600 break-words text-xs">
                        {snippet.name}
                      </div>
                      {snippet.description && (
                        <div className="text-xs text-gray-500 break-words h-8 overflow-hidden">
                          {snippet.description}
                        </div>
                      )}
                    </div>
                  </LinkWithNewTabHandling>
                </li>
              ))}
            </ul>
          ) : (
            <Alert variant="default" className="p-4">
              No results found for "{searchQuery}"
            </Alert>
          )}
        </div>
      )}
    </form>
  )
}

export default SearchComponent
