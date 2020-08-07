import React, {useState, useEffect, useRef} from "react"
import PropTypes from "prop-types"
import {useSelector, useDispatch} from "react-redux"
import {Text, measureElement} from "ink"
import useStdoutDimensions from "ink-use-stdout-dimensions"
import SelectInput from "./List"

import {Layout, Pane} from "./Layout"
import {selectItem, goBack, goForward} from "../reducers"

// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) {
    return "0"
  }

  const k = 1024
  const dm = Math.max(0, decimals)
  const sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

const getLabel = ({isFocused, label, type, size, w}) => {
  const fs = type === "file" ? formatBytes(size) : size.toString()
  const maybeFs = isFocused ? fs : ""
  const extraSpace = isFocused ? fs.length + 3 : 3
  const spaceLength = w - label.length - extraSpace

  return ` ${label}${Array(Math.max(0, spaceLength)).fill(" ").join("")}${maybeFs} `
}

const getColor = ({colors, type}) => colors[type]

const Renderer = props => {
  const {
    data,
    limit,
    w,
    onSelect,
    isFocused,
    selectedItem,
    colors,
  } = props

  if (Array.isArray(data)) {
    return (
      <SelectInput
        viewSize={limit}
        selectedItem={selectedItem}
        isFocused={isFocused}
        items={data}
        onSelect={onSelect}
        indicatorComponent={Text}
        ItemComponent={({label, size, type, isSelected}) => (
          <Text
            bold={type === "directory"}
            color={isSelected ? "none" : getColor({colors, type})}
            backgroundColor={isSelected ? colors.selection : "none"}
            wrap="truncate"
          >
            {getLabel({isFocused, label, size, w, type})}
          </Text>
        )}
      />
    )
  }

  return <Text key={1} wrap="truncate">{data}</Text>
}

const Main = () => {
  const [r1, r2, r3] = [useRef(), useRef(), useRef()]
  const [[w1, w2, w3], setWidth] = useState([0, 0, 0])
  const [_, rows] = useStdoutDimensions()
  const dispatch = useDispatch()
  const {
    currentContent,
    currentSelected,
    currentPath,
    childContent,
    childSelected,
    childPath,
    parentContent,
    parentSelected,
    parentPath,
    settings,
  } = useSelector(s => s)

  useEffect(() => {
    setWidth([r1, r2, r3].map(r => measureElement(r.current).width))
  }, [])

  const onMoveRight = () => {
    dispatch(goForward())
  }

  const onMoveLeft = () => {
    dispatch(goBack())
  }

  const onSelect = item => {
    dispatch(selectItem({currentSelected: currentContent.content.findIndex(
      p => p.content === item.label,
    )}))
  }

  const mapModel = ({content, type}, path) => (
    (type === "directory" && Array.isArray(content)) ?
      // eslint-disable-next-line
      content.map(({content, size, type}) => ({
        size,
        path,
        type,
        label: content,
        value: `${path}/${content}`,
      })) :
      content
  )

  const limit = rows

  return (
    <Layout height={limit} onMoveLeft={onMoveLeft} onMoveRight={onMoveRight}>
      <Pane ref={r1} key={0} width="10%">
        <Renderer
          colors={settings.colors}
          limit={limit}
          selectedItem={parentSelected}
          data={mapModel(parentContent, parentPath)}
          w={w1}
        />
      </Pane>
      <Pane ref={r2} key={1} width="40%">
        <Renderer
          isFocused
          colors={settings.colors}
          limit={limit}
          selectedItem={currentSelected}
          onSelect={onSelect}
          data={mapModel(currentContent, currentPath)}
          w={w2}
        />
      </Pane>
      <Pane ref={r3} key={2} width="50%">
        <Renderer
          colors={settings.colors}
          limit={limit}
          selectedItem={childSelected}
          data={mapModel(childContent, childPath)}
          w={w3}
        />
      </Pane>
    </Layout>
  )
}

Renderer.defaultProps = {
  w: 0,
  isFocused: false,
  selectedItem: 0,
  onSelect: _ => _,
  limit: 20,
}

Renderer.propTypes = {
  w: PropTypes.number,
  data: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object])),
    PropTypes.string,
  ]).isRequired,
  limit: PropTypes.number,
  isFocused: PropTypes.bool,
  onSelect: PropTypes.func,
  selectedItem: PropTypes.number,
  colors: PropTypes.objectOf(PropTypes.string).isRequired,
}

export default Main
