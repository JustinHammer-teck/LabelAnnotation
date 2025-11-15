import React, { useState , useEffect, useContext} from "react";
import { useParams as useRouterParams } from "react-router";
import { Redirect } from "react-router-dom";
import { useAtom } from "jotai";
import { Button } from "../../components";
import { Oneof } from "../../components/Oneof/Oneof";
import { Spinner } from "../../components/Spinner/Spinner";
import { ApiContext } from "../../providers/ApiProvider";
import { useContextProps } from "../../providers/RoutesProvider";
import { Block, Elem } from "../../utils/bem";
import { CreateProject } from "../CreateProject/CreateProject";
import { DataManagerPage } from "../DataManager/DataManager";
import { SettingsPage } from "../Settings";
import "./Projects.scss";
import { EmptyProjectsList, ProjectsList } from "./ProjectsList";
import { useAbortController } from "@humansignal/core";
import {useTranslation} from "react-i18next";
import {useUserRole} from "../../hooks/useUserRole";
import { TabsContainer } from "./tabs-container";
import { FilesList } from "./files-list";
import { activeTabAtom } from "./files-atoms";

const getCurrentPage = () => {
  const pageNumberFromURL = new URLSearchParams(location.search).get("page");

  return pageNumberFromURL ? Number.parseInt(pageNumberFromURL) : 1;
};

export const ProjectsPage = () => {
  const api = useContext(ApiContext);
  const abortController = useAbortController();
  const [projectsList, setProjectsList] = useState([]);
  const [networkState, setNetworkState] = useState(null);
  const [currentPage, setCurrentPage] = useState(getCurrentPage());
  const [totalItems, setTotalItems] = useState(1);
  const setContextProps = useContextProps();
  const defaultPageSize = Number.parseInt(localStorage.getItem("pages:projects-list") ?? 30);
  const { isManagerOrResearcher } = useUserRole();
  const [activeTab] = useAtom(activeTabAtom);

  const [modal, setModal] = useState(false);

  const openModal = () => setModal(true);

  const closeModal = () => setModal(false);

  const fetchProjects = async (page = currentPage, pageSize = defaultPageSize) => {
    setNetworkState("loading");
    abortController.renew(); // Cancel any in flight requests

    const requestParams = { page, page_size: pageSize };

    requestParams.include = [
      "id",
      "title",
      "created_by",
      "created_at",
      "color",
      "is_published",
      "assignment_settings",
    ].join(",");

    const data = await api.callApi("projects", {
      params: requestParams,
      signal: abortController.controller.current.signal,
      errorFilter: (e) => e.error.includes("aborted"),
    });

    setTotalItems(data?.count ?? 1);
    setProjectsList(data.results ?? []);
    setNetworkState("loaded");

    if (data?.results?.length) {
      const additionalData = await api.callApi("projects", {
        params: {
          ids: data?.results?.map(({ id }) => id).join(","),
          include: [
            "id",
            "description",
            "num_tasks_with_annotations",
            "task_number",
            "skipped_annotations_number",
            "total_annotations_number",
            "total_predictions_number",
            "ground_truth_number",
            "finished_task_number",
          ].join(","),
          page_size: pageSize,
        },
        signal: abortController.controller.current.signal,
        errorFilter: (e) => e.error.includes("aborted"),
      });

      if (additionalData?.results?.length) {
        setProjectsList((prev) =>
          additionalData.results.map((project) => {
            const prevProject = prev.find(({ id }) => id === project.id);

            return {
              ...prevProject,
              ...project,
            };
          }),
        );
      }
    }
  };

  const loadNextPage = async (page, pageSize) => {
    setCurrentPage(page);
    await fetchProjects(page, pageSize);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // there is a nice page with Create button when list is empty
    // so don't show the context button in that case
    setContextProps({ openModal, showButton: isManagerOrResearcher && projectsList.length > 0 });
  }, [projectsList.length]);

  const tabs = [
    { key: 'projects', label: 'Projects' },
    ...(isManagerOrResearcher ? [{ key: 'files', label: 'Files' }] : []),
  ];

  return (
    <Block name="projects-page">
      <Oneof value={networkState}>
        <Elem name="loading" case="loading">
          <Spinner size={64} />
        </Elem>
        <Elem name="content" case="loaded">
          <TabsContainer tabs={tabs}>
            {activeTab === 'projects' ? (
              <>
                {projectsList.length ? (
                  <ProjectsList
                    projects={projectsList}
                    currentPage={currentPage}
                    totalItems={totalItems}
                    loadNextPage={loadNextPage}
                    pageSize={defaultPageSize}
                  />
                ) : (
                  <EmptyProjectsList openModal={openModal} />
                )}
              </>
            ) : (
              <FilesList />
            )}
          </TabsContainer>
          {modal && <CreateProject onClose={closeModal} />}
        </Elem>
      </Oneof>
    </Block>
  );
};

ProjectsPage.title = "Projects";
ProjectsPage.path = "/projects";
ProjectsPage.exact = true;
ProjectsPage.routes = ({ store }) => [
  {
    title: () => store.project?.title,
    path: "/:id(\\d+)",
    exact: true,
    component: () => {
      const params = useRouterParams();

      return <Redirect to={`/projects/${params.id}/data`} />;
    },
    pages: {
      DataManagerPage,
      SettingsPage,
    },
  },
];
ProjectsPage.context = ({ openModal, showButton }) => {
  if (!showButton) return null;

  const { t } = useTranslation();

  return (
    <Button onClick={openModal} look="primary" size="compact">
      {t("project_page.create_button")}
    </Button>
  );
};
