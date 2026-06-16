import { useEffect, useRef, useState } from 'react'

const SearchableDropdown = ({
  options,
  label,
  id,
  selectedVal,
  handleChange,
  isDisabled,
  addClassName,
  onClick,
  placeholder
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const inputRef = useRef(null)

  useEffect(() => {
    document.addEventListener('click', toggle)
    return () => document.removeEventListener('click', toggle)
  }, [])

  const selectOption = option => {
    setQuery(() => '')
    handleChange(option[label])
    setIsOpen(isOpen => !isOpen)
  }

  function toggle (e) {
    setIsOpen(e && e.target === inputRef.current)
  }

  const getDisplayValue = () => {
    if (query) return query
    if (selectedVal) return selectedVal

    return ''
  }

  const filter = options => {
    return options.filter(
      option => option[label].toLowerCase().indexOf(query.toLowerCase()) > -1
    )
  }



  return (
    <div className={`dropdown ${addClassName ? addClassName : ''}`}>
      {/* <button
      onClick={isDisabled ? null : onClick}
      className={`dropdownBtn ${isDisabled ? 'disabled' : ''}`}
    >
      {selectedVal ? selectedVal : placeholder}
      <i className='fas fa-angle-down'></i>
    </button> */}
      <input
        ref={inputRef}
        type='text'
        value={getDisplayValue()}
        name='searchTerm'
        onChange={e => {
          setQuery(e.target.value)
          handleChange(null)
        }}
        onClick={toggle}
        className='dropdownBtn'
      />
      {isOpen ? (
        <i class='fas fa-angle-up'></i>
      ) : (
        <i class='fas fa-angle-down'></i>
      )}
       <div className={`dropdownList ${isOpen ? 'show' : 'hide'}`}>
        {options &&
          options.map((li, key) => (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a
              // eslint-disable-next-line no-script-url
              href='javascript:void(0)'
              key={key}
              disabled={isDisabled}
              onClick={e => {
                setIsOpen(!isOpen)
                handleChange(e, li)
              }}
            >
              {li.name}
            </a>
          ))}
      </div>
    </div>


    // <div className="dropdown">
    //   <div className="dropdownBtn">
    //     <div className="selected-value">
    //       <input
    //         ref={inputRef}
    //         type="text"
    //         value={getDisplayValue()}
    //         name="searchTerm"
    //         onChange={(e) => {
    //           setQuery(e.target.value);
    //           handleChange(null);
    //         }}
    //         onClick={toggle}
    //         className="dropdownBtn"
    //       />
    //     </div>
    //     <div className={`arrow ${isOpen ? "open" : ""}`}></div>
    //     {isOpen
    //                 ? (<i class="fas fa-angle-up"></i>)
    //                 : (<i class="fas fa-angle-down"></i>)}
    //   </div>

    //   <div className={`dropdownList ${isOpen ? "open" : ""}`}>
    //     {options && filter(options).map((option, index) => {
    //       return (
    //         <div
    //           onClick={() => selectOption(option)}
    //           className={`option ${
    //             option[label] === selectedVal ? "selected" : ""
    //           }`}
    //           key={`${id}-${index}`}
    //         >
    //           {option[label]}
    //         </div>
    //       );
    //     })}
    //   </div>
    // </div>
  )
}

export default SearchableDropdown
