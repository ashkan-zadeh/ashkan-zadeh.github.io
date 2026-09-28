import React from "react"
import CustomFonts from "@wkocjan/gatsby-theme-intro/src/components/custom-fonts/custom-fonts"
import Footer from "@wkocjan/gatsby-theme-intro/src/components/footer/footer"
import Header from "../@wkocjan/gatsby-theme-intro/components/header/header"
import Sidebar from "@wkocjan/gatsby-theme-intro/src/components/sidebar/sidebar"
import StructuredData from "@wkocjan/gatsby-theme-intro/src/components/structured-data/structured-data"
import "@wkocjan/gatsby-theme-intro/src/styles/style.css"

const PageShell = ({ children, profile, social, title }) => (
  <div className="antialiased bg-back leading-normal font-text text-front">
    <StructuredData profile={profile} social={social} />
    <CustomFonts />
    <Header initials={profile.initials} />
    <div className="md:max-w-screen-sm lg:max-w-screen-xl mx-auto px-4 flex flex-wrap pt-4 my-8">
      <Sidebar profile={profile} social={social} />
      <main className="lg:w-2/3 lg:pl-8 xl:pl-12">
        {title && (
          <header className="border-b border-line pb-8 mb-10">
            <h1 className="font-header font-black text-front text-5xl leading-none break-words">
              {title}
            </h1>
          </header>
        )}
        {children}
      </main>
    </div>
    <Footer name={profile.name} showThemeLogo={false} />
  </div>
)

export default PageShell
