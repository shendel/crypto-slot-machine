import { useStorageContract } from './useContract'
import { useEffect, useState } from 'react'
import { getCurrentDomain } from "../helpers/getCurrentDomain"
import { getConnectedAddress } from "../helpers/setupWeb3"
import isProd from "../helpers/isProd"
import { CHAIN_INFO } from "../helpers/constants"

const storageAddressByChainId = {
  5: '0xafb8f27df1f629432a47214b4e1674cbcbdb02df',
  56: '0xa7472f384339D37EfE505a1A71619212495A973A',
  1800500: '0x7f79Cc96f784d0a339c49738f1cB3807A9f0ec3C',
}

const storageChainIdMainnet = 1800500 //56
const storageChainIdTestnet = 1800500 //5


const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'


export const getStorageInfo = () => {
  const _isProd = isProd()
  
  const storageChainId = _isProd ? storageChainIdMainnet : storageChainIdTestnet
  const storageChainInfo = CHAIN_INFO(storageChainId)
  const storageRpc = storageChainInfo.rpcUrls[0]
  const storageAddress = storageAddressByChainId[storageChainId]

  return {
    storageChainId,
    storageAddress,
    storageRpc,
    storageChainInfo,
  }
}

const parseInfo = (info) => {
  const parsed = {
    chainId: '',
    slotsContractAddress: '',
    bankTokenAddress: '',
    bankTokenInfo: {},
    tokenPrice: 0,
    texts: {},
    design: {},
    menu: false,
  }
  const result = JSON.parse(info)

  Object.keys(parsed).forEach((optKey) => {
    if (result[optKey]) parsed[optKey] = result[optKey]
  })
  return parsed
}


export default function useStorage() {
  const [storageData, setStorageData] = useState(null)
  const [storageIsLoading, setStorageIsLoading] = useState(true)
  const [storageTexts, setStorageTexts] = useState({})
  const [storageDesign, setStorageDesign] = useState({})
  const [storageMenu, setStorageMenu] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [error, setError] = useState(null)

  const storage = useStorageContract()
  
  const [ doReloadStorage, setDoReloadStorage ] = useState(true)

  useEffect(() => {
    if (doReloadStorage) {
      const fetchData = async () => {
        if (!storage) {
          console.log('>>> no storage')
          return
        }
        
        setError(null)
        setStorageIsLoading(true)
        
        let parsed: any
        let owner

        try {
          storageData = await storage.methods.getData(getCurrentDomain()).call()
          parsed = parseInfo(storageData.info || '{}')
        } catch (error) {
          console.log('>>> error', error)
          setError(error)
        }
        console.log('>>> storageData parsed', parsed)
        if (parsed) {
          const { owner } = storageData

          const isBaseConfigReady = (
            parsed.chainId !== ''
            && parsed.slotsContractAddress !== ''
          )

          setStorageData({
            ...parsed,
            owner: owner === ZERO_ADDRESS ? '' : owner,
            isBaseConfigReady,
            isInstalled: !(owner === ZERO_ADDRESS),
          })
          setIsInstalled(!(owner === ZERO_ADDRESS))
          setStorageTexts(parsed.texts)
          setStorageDesign(parsed.design)
          setStorageMenu(parsed.menu)
          const connectedWallet = await getConnectedAddress()
          if (connectedWallet && connectedWallet.toLowerCase() === owner.toLowerCase()) {
            setIsOwner(true)
          }
        }
        
        setStorageIsLoading(false)
      }
      fetchData()
      setDoReloadStorage(false)
    }
  }, [ doReloadStorage ])

  return {
    storageIsLoading,
    storageData,
    isOwner,
    isInstalled,
    error,
    storageTexts,
    storageMenu,
    storageDesign,
    setDoReloadStorage,
  }
}