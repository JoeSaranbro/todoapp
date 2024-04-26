import  { useState, useEffect } from 'react'
import axios from 'axios'
const useFetch = (url) => {
    const [data, setData] = useState(null)
    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState([])
    useEffect(() => {
          
     setTimeout(() => {
        const fetchData = async () => {
          try {
              const res =  await axios.get(url)
              if (res.data.errno) {
                setLoading(false)
                setError(res.data.code)
                
              } else if (res.data.fatal === false)  {
                setLoading(false)
                setError(res.data.code)
              } else {
                setLoading(false)
                setData(res.data);
              }
              
              
          } catch (error) {
              setLoading(false)
              setError(error.message)
            
              
          }
        };
        fetchData();
      }, 1000);
        
        
        
      }, [url]);
      

  return { data, isLoading, error, setError}
}

export default useFetch