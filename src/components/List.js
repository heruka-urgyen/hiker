import React, {useEffect, useState} from "react"
import PropTypes from "prop-types"
import {Box, useInput} from "ink"

const calculateListWindow = (items, viewSize, selectedItem) => {
  if (items.length <= viewSize) {
    return {items, selected: selectedItem}
  }

  const nextWindow = (viewSize / 2) - ((viewSize / 2) % 1)

  if (selectedItem + nextWindow >= items.length) {
    return {items: items.slice(-viewSize), selected: viewSize - items.length + selectedItem}
  }

  if (selectedItem - nextWindow < 0) {
    return {items: items.slice(0, viewSize), selected: selectedItem}
  }

  return {
    items: items.slice(selectedItem - nextWindow, selectedItem + nextWindow),
    selected: nextWindow,
  }
}

const List = props => {
  const {
    items,
    viewSize,
    onSelect,
    selectedItem,
    ItemComponent,
  } = props

  const [state, setState] = useState({items, selected: selectedItem})
  const [timesPressed, press] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setState(
      calculateListWindow(items, viewSize, selectedItem),
    ), 0)

    return () => clearTimeout(t)
  }, [items])

  useEffect(() => {
    const t = setTimeout(() => press(0), 100)

    return () => clearTimeout(t)
  }, [timesPressed])

  useInput((input, key) => {
    if (input === "G" && key.shift) {
      setState(calculateListWindow(items, viewSize, items[items.length - 1]))
      onSelect(items[items.length - 1])
    }

    if (input === "g") {
      const p = timesPressed + 1
      press(p)

      if (p > 1) {
        setState(calculateListWindow(items, viewSize, selectedItem))
        onSelect(items[0])
      }
    }

    if (input === "j" || key.downArrow) {
      if (state.selected !== state.items.length - 1) {
        onSelect(state.items[state.selected + 1])
      }
    }

    if (input === "k" || key.upArrow) {
      if (state.selected !== 0) {
        onSelect(state.items[state.selected - 1])
      }
    }
  })

  return (
    <Box flexDirection="column">
      {state.items.map((item, i) => (
        <ItemComponent
          key={item.value}
          label={item.label}
          value={item.value}
          size={item.size}
          type={item.type}
          isSelected={state.selected === i}
        />
      ))}
    </Box>
  )
}

List.defaultProps = {
  selectedItem: 0,
}

List.propTypes = {
  items: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object])),
    PropTypes.string,
  ]).isRequired,
  viewSize: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedItem: PropTypes.number,
  ItemComponent: PropTypes.func.isRequired,
}

export default List
