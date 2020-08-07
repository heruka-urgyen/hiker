import React, {useState, useEffect, useRef} from "react"
import PropTypes from "prop-types"
import {useSelector, useDispatch} from "react-redux"
import {Text, measureElement} from "ink"
import useStdoutDimensions from "ink-use-stdout-dimensions"
import SelectInput from "ink-select-input"

import {Layout, Pane} from "./Layout"
import {selectItem, goBack, goForward} from "../reducers"

const Renderer = props => {
  const {
    data,
    limit,
    w,
    onHighlight,
    isFocused,
    initialIndex,
  } = props

  if (Array.isArray(data)) {
    return (
      <SelectInput
        limit={limit}
        initialIndex={initialIndex}
        isFocused={isFocused}
        items={data}
        onHighlight={onHighlight}
        indicatorComponent={Text}
        itemComponent={({label, isSelected}) => (
          <Text
            backgroundColor={isSelected ? "red" : "none"}
            wrap="truncate"
          >
            {` ${label}${Array(Math.max(0, w - label.length - 2)).fill(" ").join("")}`}
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

  const onHighlight = item => {
    dispatch(selectItem({currentSelected: currentContent.content.findIndex(
      p => p.content === item.label,
    )}))
  }

  const mapModel = ({content, type}, path) => type === "directory" ?
    // eslint-disable-next-line
    content.map(({content, type}) => ({
      path,
      type,
      label: content,
      value: `${path}/${content}`,
    })) :
    content

  const limit = rows

  return (
    <Layout height={limit} onMoveLeft={onMoveLeft} onMoveRight={onMoveRight}>
      <Pane ref={r1} key={0} width="10%">
        <Renderer
          limit={limit}
          initialIndex={parentSelected}
          data={mapModel(parentContent, parentPath)}
          w={w1}
        />
      </Pane>
      <Pane ref={r2} key={1} width="40%">
        <Renderer
          isFocused
          limit={limit}
          initialIndex={currentSelected}
          onHighlight={onHighlight}
          data={mapModel(currentContent, currentPath)}
          w={w2}
        />
      </Pane>
      <Pane ref={r3} key={2} width="50%">
        <Renderer
          limit={limit}
          initialIndex={childSelected}
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
  initialIndex: 0,
  onHighlight: _ => _,
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
  onHighlight: PropTypes.func,
  initialIndex: PropTypes.number,
}

export default Main
