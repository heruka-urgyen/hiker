/* eslint-disable react/jsx-props-no-spreading */

import React, {useState} from "react"
import {useDispatch} from "react-redux"
import {Text, Box, useInput, useApp} from "ink"
import PropTypes from "prop-types"
import TextInput from "ink-text-input"

import {searchElement} from "../reducers"

export const Pane = React.forwardRef(({children, ...props}, ref) => (
  <Box flexGrow={1} ref={ref} {...props}>
    {children}
  </Box>
))

const onChange = ({action, updateQuery}) => query => {
  action({query})
  updateQuery(query)
}

const onSubmit = ({toggleStatusBar, updateQuery}) => _ => {
  toggleStatusBar(false)
  updateQuery("")
}

const StatusBar = props => {
  const {
    isActive,
    command,
    toggleStatusBar,
  } = props

  const dispatch = useDispatch()
  const [query, updateQuery] = useState("")

  if (isActive && command === "search") {
    return (
      <TextInput
        value={query}
        placeholder=":search"
        onChange={onChange({action: v => dispatch(searchElement(v)), updateQuery})}
        onSubmit={onSubmit({toggleStatusBar, updateQuery})}
      />
    )
  }

  return <Text> </Text>
}

export const Layout = ({children, onMoveLeft, onMoveRight, ...props}) => {
  const {exit} = useApp()
  const [statusBarIsActive, toggleStatusBar] = useState(false)
  const [statusCommand, setStatusCommand] = useState("")

  useInput((input, key) => {
    if (!statusBarIsActive) {
      if (input === "q") {
        exit()
      }

      if (input === "l" || key.rightArrow || key.return) {
        onMoveRight()
      }

      if (input === "h" || key.leftArrow) {
        onMoveLeft()
      }

      if (input === "/") {
        toggleStatusBar(true)
        setStatusCommand("search")
      }
    }
  })

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" {...props}>
        {children}
      </Box>
      <StatusBar
        isActive={statusBarIsActive}
        command={statusCommand}
        toggleStatusBar={toggleStatusBar}
      />
    </Box>
  )
}

Pane.propTypes = {
  children: PropTypes.element.isRequired,
}

StatusBar.propTypes = {
  isActive: PropTypes.bool.isRequired,
  command: PropTypes.string.isRequired,
  toggleStatusBar: PropTypes.func.isRequired,
}

Layout.propTypes = {
  onMoveLeft: PropTypes.func.isRequired,
  onMoveRight: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
}
