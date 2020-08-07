import React from "react"
import PropTypes from "prop-types"
import {Box, useInput} from "ink"

const calculateListWindow = (items, viewSize, selectedItem) => {
  if (items.length <= viewSize) {
    return {items, selected: selectedItem}
  }

  const nextWindow = (viewSize / 2) - ((viewSize / 2) % 1)

  if (selectedItem <= nextWindow) {
    return {items: items.slice(0, viewSize), selected: selectedItem}
  }

  const sliced = items.length > viewSize ? items.slice(nextWindow) : items.slice(-nextWindow)
  return calculateListWindow(sliced, viewSize, selectedItem - nextWindow)
}

const List = props => {
  const {
    items,
    viewSize,
    onSelect,
    selectedItem,
    ItemComponent,
  } = props

  const listWindow = calculateListWindow(items, viewSize, selectedItem)

  useInput((input, key) => {
    if (input === "j" || key.arrowDown) {
      if (selectedItem !== items.length - 1) {
        onSelect(items.find((_, i) => selectedItem === i - 1))
      }
    }

    if (input === "k" || key.arrowUp) {
      if (selectedItem !== 0) {
        onSelect(items.find((_, i) => selectedItem === i + 1))
      }
    }
  })

  return (
    <Box flexDirection="column">
      {listWindow.items.map((item, i) => (
        <ItemComponent
          key={item.value}
          label={item.label}
          value={item.value}
          isSelected={listWindow.selected === i}
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
