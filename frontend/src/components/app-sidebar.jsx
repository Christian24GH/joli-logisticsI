import {
  Car,
  Command,
  LifeBuoy,
  PieChartIcon,
  Send,
  WrenchIcon,
  BookOpenCheckIcon,
  Gauge,
  ChartSpline,
  User,
  TagsIcon,
  HistoryIcon,
  LogsIcon,
  MapPinIcon,
  GlobeIcon
} from "lucide-react"

import { Link } from 'react-router'
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Skeleton } from '@/components/ui/skeleton'

import AuthContext from "../context/AuthProvider"
import { useContext } from "react"

import logo from '@/assets/joli_cropped.png'
const data = {

  /** Logistics 1 NavItems */
  logisticsINav: [
    {
      NavGroup: {
        NavLabel: 'Smart Warehousing System',
        NavItems: [
          {
                        title: "Inventory Management",
            url: '/InventoryManagement',
            icon: Gauge,
          },
          {
                        title: "Storage Organization",
            url: '/StorageOrganization',
            icon: PieChartIcon,
          },
          {
                        title: "Stock Monitoring",
            url: '/StockMonitoring',
            icon: ChartSpline,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Procurement & Sourcing Management',
        NavItems: [
          {
                        title: "Supplier Management",
            url: '/SupplierManagement',
            icon: User,
          },
          {
                        title: "Purchase Processing",
            url: '/PurchaseProcessing',
            icon: WrenchIcon,
          },
          {
                        title: "Expense Records",
            url: '/ExpenseRecords',
            icon: LifeBuoy,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Project Logistic Tracker',
        NavItems: [
          {
                        title: "Equipment Scheduling",
            url: '/EquipmentScheduling',
            icon: BookOpenCheckIcon,
          },
          {
                        title: "Delivery & Transport Tracking",
            url: '/DeliveryTransportTracking',
            icon: TagsIcon,
          },
          {
                        title: "Tour Reports",
            url: '/TourReports',
            icon: HistoryIcon,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Asset Lifecycle & Maintenance',
        NavItems: [
          {
            title: "Asset Registration & QR Tagging",
            url: '/AssetRegistration',
            icon: User,
          },
          {
            title: "Predictive Maintenance",
            url: '/PredictiveMaintenance',
            icon: WrenchIcon,
          },
          {
            title: "Maintenance History",
            url: '/MaintenanceHistory',
            icon: LogsIcon,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Document Tracking & Logistics Records',
        NavItems: [
          {
            title: "Delivery Receipts",
            url: '/DeliveryReceipts',
            icon: BookOpenCheckIcon,
          },
          {
            title: "Check-In/Check-Out Logs",
            url: '/CheckInOutLogs',
            icon: LifeBuoy,
          },
          {
            title: "Logistics Reports",
            url: '/LogisticsReports',
            icon: HistoryIcon,
          },
        ],
      }
    },
  ],

  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  
}

export function AppSidebar({...props}) {
  const { auth, logout, loading } = useContext(AuthContext)
  const user = {
    name: auth?.name,
    role: auth?.role,
    avatar: null,
    email: auth?.email
  }

  return (
    <Sidebar collapsible="icon" {...props} className="rounded-md">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>            
            <Link to="/" className="flex justify-center">
              <img src={logo} className="h-10  object-scale-down" alt=""/>
            </Link>
              {/* 
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div
                  className="bg-[var(--vivid-neon-pink)] text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GlobeIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">JOLI Travel and Tours</span>
                  <span className="truncate text-xs">
                    {loading ? (<Skeleton className="w-2/3 h-full"/>) :
                     user.role == "LogisticsI Admin"  ? 'Logistics I Admin' : //just copy this line
                     user.role == "LogisticsII Admin" ? 'Logistics II Admin' :
                     //and place it here

                     null
                    }
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
              */}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-2">
        
        {loading ? (
            // Skeleton Placeholder while loading
            <div className="flex flex-col gap-2 px-2 h-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="flex-1 w-full" />
              <Skeleton className="flex-1 w-full" />
            </div>
          ) : (
            <>
              {user.role === "LogisticsII Admin" ? 
              (<NavMain data={data.logisticsIINav}/>) 
              : user.role === "LogisticsI Admin" ? 
              (<NavMain data={data.logisticsINav}/>) // add more here via ?(<NavMain data={data.yoursidebaritems}/>)
              : null}
            </>
          )
        }
      </SidebarContent>
      <SidebarRail/>
      <SidebarFooter>
        {loading ? 
          (<Skeleton className="w-full h-full"/>) : (<NavUser user={user} logout={logout} />)
        }
      </SidebarFooter>
    </Sidebar>
  );
}
