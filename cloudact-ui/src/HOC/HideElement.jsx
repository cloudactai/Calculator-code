type IProps = {
    children: React.ReactNode,
    conditionToShow: boolean,
}

const HideElement = ({children, conditionToShow} : IProps) => {
  return conditionToShow ? <>{children}</> : null 
}

export default HideElement