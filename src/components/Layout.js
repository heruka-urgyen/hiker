/* eslint-disable react/jsx-props-no-spreading */

import React from "react"
import {Box, useInput} from "ink"
import PropTypes from "prop-types"

export const Pane = React.forwardRef(({children, ...props}, ref) => (
  <Box flexGrow={1} ref={ref} {...props}>
    {children}
  </Box>
))

export const Layout = ({children, onMoveLeft, onMoveRight, ...props}) => {
  useInput((input, _) => {
    if (input === "l") {
      onMoveRight()
    }

    if (input === "h") {
      onMoveLeft()
    }
  })

  return (
    <Box flexDirection="row" {...props}>
      {children}
    </Box>
  )
}

Pane.propTypes = {
  children: PropTypes.element.isRequired,
}

Layout.propTypes = {
  children: PropTypes.element.isRequired,
  onMoveLeft: PropTypes.func.isRequired,
  onMoveRight: PropTypes.func.isRequired,
}
