
const DashboardCards = ({ data }) => {

  const Nilstyling = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px'
  }

  return (
    <>
      {
        data?.count ?
          <>
            <Card data={data} cardKey={"Title"} />
            <Card data={data} cardKey={"Balance"} />
          </> :
          <div style={Nilstyling}>
            <span>Nil</span>
          </div>
      }

    </>

  )
}

export default DashboardCards



const Card = ({ data, cardKey }) => {
  return <>

    {
      cardKey == "Title" &&
      <div className="compliance ar" style={{ marginTop: data?.first_title === 'Tasks' ? '120px' : '0' }}>
        <span>{data?.count}</span>
        <span className="h5">{data?.first_title}</span>
      </div>
    }


    {
      cardKey == "Balance" &&
      <div className="compliance ar">
        <span>{data?.balance}</span>
        <span className="h5">{data?.secound_title}</span>
      </div>
    }


  </>

}