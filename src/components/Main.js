import React, {useState, useEffect, useRef} from "react"
import PropTypes from "prop-types"
import {useSelector, useDispatch} from "react-redux"
import {Text, measureElement} from "ink"
import useStdoutDimensions from "ink-use-stdout-dimensions"
import List from "./List"

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

const getSize = (type, size) => {
  if (type === "directory") {
    return size.toString()
  }

  if (type === "symlink") {
    return `~> ${formatBytes(size)}`
  }

  return formatBytes(size)
}

const getLabel = ({isFocused, label, type, size, w}) => {
  const fs = getSize(type, size)
  const maybeFs = isFocused ? fs : ""
  const extraSpace = isFocused ? fs.length + 3 : 3
  const spaceLength = w - label.length - extraSpace

  return ` ${label}${Array(Math.max(0, spaceLength)).fill(" ").join("")}${maybeFs} `
}

const getColor = ({colors, type}) => colors[type]

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

const onSelect = (dispatch, content) => item => {
  dispatch(selectItem({currentSelected: content.content.findIndex(
    p => p.content === item.label,
  )}))
}

const Renderer = props => {
  const {
    limit,
    w,
    isFocused,
    selector,
  } = props

  const dispatch = useDispatch()

  const {colors, selectedItem, content, path} = useSelector(s => ({
    colors: s.settings.colors,
    selectedItem: s[`${selector}Selected`],
    content: s[`${selector}Content`],
    path: s[`${selector}Path`],
  }))

  const data = mapModel(content, path)

  if (Array.isArray(data)) {
    return (
      <List
        viewSize={limit}
        selectedItem={selectedItem}
        isFocused={isFocused}
        items={data}
        onSelect={selector === "current" ? onSelect(dispatch, content) : _ => _}
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

  useEffect(() => {
    setWidth([r1, r2, r3].map(r => measureElement(r.current).width))
  }, [])

  const onMoveRight = () => {
    dispatch(goForward())
  }

  const onMoveLeft = () => {
    dispatch(goBack())
  }

  const limit = rows

  return (
    <Layout height={limit} onMoveLeft={onMoveLeft} onMoveRight={onMoveRight}>
      <Pane ref={r1} key={0} width="10%">
        <Renderer
          selector="parent"
          limit={limit}
          w={w1}
        />
      </Pane>
      <Pane ref={r2} key={1} width="40%">
        <Renderer
          isFocused
          selector="current"
          limit={limit}
          w={w2}
        />
      </Pane>
      <Pane ref={r3} key={2} width="50%">
        <Renderer
          selector="child"
          limit={limit}
          w={w3}
        />
      </Pane>
    </Layout>
  )
}

Renderer.defaultProps = {
  w: 0,
  isFocused: false,
  limit: 20,
}

Renderer.propTypes = {
  w: PropTypes.number,
  limit: PropTypes.number,
  isFocused: PropTypes.bool,
  selector: PropTypes.string.isRequired,
}

export default Main
